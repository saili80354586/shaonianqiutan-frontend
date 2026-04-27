import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatCurrency, generateId, debounce, throttle } from './utils';

describe('cn (className merge)', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
    expect(cn('foo', ['bar', 'baz'])).toBe('foo bar baz');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null, undefined, false)).toBe('');
  });
});

describe('formatDate', () => {
  it('should format date string correctly', () => {
    const date = '2026-03-30';
    expect(formatDate(date)).toBe('2026年03月30日');
  });

  it('should format Date object correctly', () => {
    const date = new Date('2026-03-30');
    expect(formatDate(date)).toBe('2026年03月30日');
  });

  it('should format with custom pattern', () => {
    const date = '2026-03-30';
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2026-03-30');
    expect(formatDate(date, 'MM/DD/YYYY')).toBe('03/30/2026');
  });
});

describe('formatCurrency', () => {
  it('should format currency with default options', () => {
    expect(formatCurrency(1000)).toBe('¥1,000.00');
    expect(formatCurrency(1234567.89)).toBe('¥1,234,567.89');
  });

  it('should format currency with custom currency', () => {
    expect(formatCurrency(100, { currency: 'USD' })).toBe('$100.00');
    expect(formatCurrency(100, { currency: 'EUR' })).toBe('€100.00');
  });

  it('should handle zero and negative values', () => {
    expect(formatCurrency(0)).toBe('¥0.00');
    expect(formatCurrency(-100)).toBe('-¥100.00');
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1).toHaveLength(10);
    expect(id2).toHaveLength(10);
  });

  it('should generate ID with custom length', () => {
    const id = generateId(20);
    expect(id).toHaveLength(20);
  });

  it('should only contain alphanumeric characters', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-zA-Z0-9]+$/);
  });
});

describe('debounce', () => {
  it('should debounce function calls', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should pass correct arguments', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    vi.useRealTimers();
  });
});

describe('throttle', () => {
  it('should throttle function calls', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
