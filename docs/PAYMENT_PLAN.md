# 支付系统开发计划

## 概述

集成微信支付和支付宝，完成订单支付闭环。

## 技术方案

### 1. 支付渠道选择
- **微信支付**：JSAPI 或 Native 支付
- **支付宝**：网页支付或手机网站支付


### 2. 支付流程
```
用户下单 → 选择支付方式 → 调用支付 SDK → 支付成功 → 回调通知 → 更新订单状态
```

### 3. 状态流转
```
pending_payment → paid → analyzing → completed
    ↓              ↓
  expired       refunded
```

## API 设计

### 创建支付
```typescript
POST /api/payment/create
Body: {
  orderId: string;
  channel: 'wechat' | 'alipay';
}
Response: {
  paymentId: string;
  // 微信支付参数
  wechatParams?: {
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  };
  // 支付宝表单 HTML
  alipayForm?: string;
}
```

### 查询支付状态
```typescript
GET /api/payment/status/:paymentId
Response: {
  paymentId: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  amount: number;
  paidAt?: string;
}
```

### 支付回调（服务器）
```typescript
POST /api/payment/webhook/wechat
POST /api/payment/webhook/alipay
// 验证签名 → 更新订单状态 → 返回成功
```

## 组件规划

### 1. PaymentButton 支付按钮
```tsx
<PaymentButton 
  orderId={orderId}
  amount={298}
  onSuccess={() => router.push('/order/success')}
  onError={(err) => toast.error(err.message)}
/>
```

### 2. PaymentStatus 支付状态
```tsx
<PaymentStatus paymentId={paymentId} />
// 显示: 待支付 / 支付成功 / 支付失败 / 已退款
```

## 文件结构
```
src/
├── pages/
│   └── payment/
│       └── index.tsx          # 支付页面
├── components/
│   └── payment/
│       ├── PaymentButton.tsx   # 支付按钮
│       ├── PaymentStatus.tsx   # 支付状态
│       └── PaymentMethods.tsx  # 支付方式选择
├── hooks/
│   └── usePayment.ts         # 支付逻辑 hook
└── services/
    └── payment.ts          # 支付 API
```

## 下一步行动
1. 创建支付按钮组件
2. 对接微信支付 SDK
3. 实现支付状态轮询
4. 测试支付流程