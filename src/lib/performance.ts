import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 防抖 Hook
 * @param value 需要防抖的值
 * @param delay 延迟时间(毫秒)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 节流函数
 * @param func 需要节流的函数
 * @param limit 限制时间(毫秒)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 图片懒加载 Hook
 * @param src 图片地址
 * @param placeholder 占位图地址
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
            };
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoaded, imageRef };
}

/**
 * 虚拟列表 Hook
 * @param itemCount 总项目数
 * @param itemHeight 每项高度
 * @param overscan 缓冲区域数量
 */
export function useVirtualList(
  itemCount: number,
  itemHeight: number,
  overscan: number = 3
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setContainerHeight(container.clientHeight);

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(itemCount, startIndex + visibleCount);
  const offsetY = startIndex * itemHeight;

  return {
    containerRef,
    startIndex,
    endIndex,
    offsetY,
    visibleCount,
  };
}

/**
 * 本地存储 Hook(带序列化)
 * @param key 存储键
 * @param initialValue 初始值
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * 记忆化计算 Hook
 * @param factory 计算函数
 * @param deps 依赖项
 */
export function useMemoized<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>({
    deps: [],
    value: undefined as any,
  });

  if (!areDepsEqual(ref.current.deps, deps)) {
    ref.current.deps = deps;
    ref.current.value = factory();
  }

  return ref.current.value;
}

function areDepsEqual(prevDeps: React.DependencyList, nextDeps: React.DependencyList): boolean {
  if (prevDeps.length !== nextDeps.length) return false;
  return prevDeps.every((dep, index) => dep === nextDeps[index]);
}

/**
 * 性能监控 Hook
 * 用于测量组件渲染时间
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Performance] ${componentName} - Render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
      );
    }

    startTime.current = endTime;
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * 预加载图片
 * @param srcs 图片地址数组
 */
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(
    srcs.map(
      (src) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve();
          img.onerror = () => reject();
        })
    )
  );
}

/**
 * 请求动画帧节流
 * @param callback 回调函数
 */
export function rafThrottle(callback: () => void) {
  let ticking = false;
  return () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
}

/**
 * 测量 Web Vitals
 */
export function measureWebVitals() {
  if ('web-vitals' in window) {
    // CLS - Cumulative Layout Shift
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          console.log('[Web Vitals] CLS:', entry.value);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] as any });

    // LCP - Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('[Web Vitals] LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] as any });

    // FID - First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry.processingStart - entry.startTime;
        console.log('[Web Vitals] FID:', fid);
      }
    }).observe({ entryTypes: ['first-input'] as any });
  }
}
