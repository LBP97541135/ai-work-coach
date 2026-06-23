import { describe, it, expect } from 'vitest';
import { getLocalDate, getLocalDateTime, nowISO } from '../src/shared/date.js';

describe('getLocalDate', () => {
  it('should return YYYY-MM-DD format', () => {
    const result = getLocalDate('Asia/Shanghai');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return correct date for Asia/Shanghai timezone', () => {
    // 北京时间 2026-01-01 02:00 = UTC 2025-12-31 18:00
    const utcDate = new Date('2025-12-31T18:00:00Z');
    const result = getLocalDate('Asia/Shanghai', utcDate);
    expect(result).toBe('2026-01-01');
  });

  it('should return correct date for Asia/Shanghai at midnight', () => {
    // 北京时间 2026-06-22 00:30 = UTC 2026-06-21 16:30
    const utcDate = new Date('2026-06-21T16:30:00Z');
    const result = getLocalDate('Asia/Shanghai', utcDate);
    expect(result).toBe('2026-06-22');
  });

  it('should return same date when UTC and local are same day', () => {
    // 北京时间 2026-06-22 14:00 = UTC 2026-06-22 06:00
    const utcDate = new Date('2026-06-22T06:00:00Z');
    const result = getLocalDate('Asia/Shanghai', utcDate);
    expect(result).toBe('2026-06-22');
  });

  it('should default to Asia/Shanghai', () => {
    const result1 = getLocalDate();
    const result2 = getLocalDate('Asia/Shanghai');
    // 两者应该是同一天（大多数情况下）
    expect(result1).toBe(result2);
  });
});

describe('getLocalDateTime', () => {
  it('should return date and time string', () => {
    const result = getLocalDateTime('Asia/Shanghai');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('nowISO', () => {
  it('should return ISO format string', () => {
    const result = nowISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
