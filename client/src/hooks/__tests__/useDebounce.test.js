import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

vi.useFakeTimers();

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('debounces value change', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );
    expect(result.current).toBe('first');

    rerender({ value: 'second', delay: 500 });
    expect(result.current).toBe('first'); // ещё не прошло 500ms

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('second');
  });

  it('clears timeout on unmount', () => {
    const { result, unmount } = renderHook(() => useDebounce('test', 500));
    unmount();
    // просто убедимся, что нет ошибок — таймер должен быть очищен
  });
});