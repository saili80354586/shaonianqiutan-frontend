import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useDebounce,
  throttle,
  useLocalStorage,
  useMemoized,
} from './performance';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'update1' });
    rerender({ value: 'update2' });
    rerender({ value: 'update3' });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('update3');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should throttle function execution', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should pass arguments correctly', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('arg1', 'arg2', 123);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });
});

describe('useLocalStorage', () => {
  let storage: Record<string, string> = {};

  beforeEach(() => {
    storage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => storage[key] || null),
        setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
        removeItem: vi.fn((key: string) => { delete storage[key]; }),
        clear: vi.fn(() => { storage = {}; }),
      },
      writable: true,
    });
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should read value from localStorage', () => {
    storage['testKey'] = JSON.stringify('stored');
    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'testKey',
      JSON.stringify('updated')
    );
  });

  it('should handle object values', () => {
    const initialValue = { name: 'test', count: 5 };
    const { result } = renderHook(() => useLocalStorage('objKey', initialValue));

    expect(result.current[0]).toEqual(initialValue);

    act(() => {
      result.current[1]({ name: 'updated', count: 10 });
    });

    expect(result.current[0]).toEqual({ name: 'updated', count: 10 });
  });
});

describe('useMemoized', () => {
  it('should memoize expensive computation', () => {
    const computeFn = vi.fn((n) => n * 2);
    const { result, rerender } = renderHook(
      ({ value }) => useMemoized(() => computeFn(value), [value]),
      { initialProps: { value: 5 } }
    );

    expect(result.current).toBe(10);
    expect(computeFn).toHaveBeenCalledTimes(1);

    rerender({ value: 5 });
    expect(result.current).toBe(10);
    expect(computeFn).toHaveBeenCalledTimes(1);

    rerender({ value: 10 });
    expect(result.current).toBe(20);
    expect(computeFn).toHaveBeenCalledTimes(2);
  });
});
