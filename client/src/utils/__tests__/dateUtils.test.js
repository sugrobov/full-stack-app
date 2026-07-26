import { formatRelativeDate } from '../dateUtils';

describe('dateUtils', () => {
  const now = new Date('2025-07-26T12:00:00Z');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns "Сегодня" for same day', () => {
    expect(formatRelativeDate('2025-07-26T10:00:00Z')).toBe('Сегодня');
  });

  it('returns "Вчера" for yesterday', () => {
    expect(formatRelativeDate('2025-07-25T12:00:00Z')).toBe('Вчера');
  });

  it('returns "N дня назад" for within a week', () => {
    // 4 дня назад = 22 июля
    expect(formatRelativeDate('2025-07-22T08:00:00Z')).toBe('4 дня назад');
  });

  it('returns formatted date for older dates', () => {
    expect(formatRelativeDate('2025-01-15T00:00:00Z')).toBe('15.01.2025');
  });
});