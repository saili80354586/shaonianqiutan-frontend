/**
 * WebSocket 服务 - 实时通知推送
 * 支持自动重连、心跳检测、消息队列
 */

import { useAuthStore } from '../store';

export interface WebSocketMessage {
  type: string;
  content: any;
}

export interface NotificationPayload {
  id: number;
  type: string;
  title: string;
  content: string;
  data?: any;
  created_at: string;
}

type MessageHandler = (payload: NotificationPayload) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectInterval: number = 5000;
  private heartbeatInterval: number = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private isManualClose: boolean = false;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;

  /**
   * 连接 WebSocket
   */
  connect(): void {
    const { token } = useAuthStore.getState();
    if (!token) {
      console.warn('WebSocket: 未登录，跳过连接');
      return;
    }

    // 判断环境使用不同协议
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || window.location.host;
    const nextUrl = `${protocol}//${host}/ws?token=${token}`;

    if (
      this.ws &&
      this.url === nextUrl &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.closeCurrentSocket(1000, 'Reconnect');

    this.url = nextUrl;
    this.isManualClose = false;
    this.createConnection();
  }

  /**
   * 创建连接
   */
  private createConnection(): void {
    try {
      console.log(`WebSocket: 正在连接... ${this.url}`);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket: 创建连接失败', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 连接成功
   */
  private handleOpen(): void {
    console.log('WebSocket: 连接成功');
    this.reconnectAttempts = 0;

    // 启动心跳
    this.startHeartbeat();

    // 发送握手消息
    this.send({ type: 'ping' });
  }

  /**
   * 收到消息
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const messages = event.data.split('\n').filter(Boolean);

      for (const msgStr of messages) {
        const message: WebSocketMessage = JSON.parse(msgStr);

        switch (message.type) {
          case 'pong':
            // 心跳响应
            break;

          case 'notification':
            // 通知消息
            this.handleNotification(message.content as NotificationPayload);
            break;

          case 'system':
            // 系统消息
            console.log('WebSocket: 收到系统消息', message.content);
            this.handleNotification({
              id: 0,
              type: 'system',
              title: '系统通知',
              content: message.content,
              created_at: new Date().toISOString(),
            });
            break;

          default:
            console.log('WebSocket: 收到未知消息类型', message.type);
        }
      }
    } catch (error) {
      console.error('WebSocket: 消息解析失败', error);
    }
  }

  /**
   * 处理通知
   */
  private handleNotification(payload: NotificationPayload): void {
    console.log('WebSocket: 收到通知', payload);

    // 触发所有处理器
    this.messageHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error('WebSocket: 通知处理器出错', error);
      }
    });
  }

  /**
   * 错误处理
   */
  private handleError(error: Event): void {
    console.error('WebSocket: 连接错误', error);
  }

  /**
   * 连接关闭
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket: 连接关闭 (code: ${event.code})`);

    this.stopHeartbeat();

    if (!this.isManualClose) {
      this.scheduleReconnect();
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('WebSocket: 最大重连次数已达上限');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * this.reconnectAttempts;

    console.log(`WebSocket: ${delay}ms 后尝试重连 (第${this.reconnectAttempts}次)`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.createConnection();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 发送消息
   */
  private send(message: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * 订阅通知
   */
  subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);

    // 返回取消订阅函数
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    this.closeCurrentSocket(1000, 'Manual close');

    console.log('WebSocket: 已断开连接');
  }

  private closeCurrentSocket(code: number, reason: string): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close(code, reason);
      this.ws = null;
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 单例
export const wsService = new WebSocketService();

// React Hook
import { useEffect, useCallback, useRef } from 'react';

export function useWebSocket(onNotification?: MessageHandler) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 连接
    wsService.connect();

    // 订阅
    if (onNotification) {
      unsubscribeRef.current = wsService.subscribe(onNotification);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [onNotification]);

  const disconnect = useCallback(() => {
    wsService.disconnect();
  }, []);

  return {
    isConnected: wsService.isConnected(),
    disconnect,
  };
}
