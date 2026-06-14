/**
 * Tests for the Toast store — in-app notifications with type-based
 * auto-dismiss timers (errors linger longer than info/success).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from './toast.store';

const toast = () => useToastStore.getState();

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('showToast', () => {
  it('adds a toast with the given type and message', () => {
    toast().showToast('success', 'Saved');
    expect(toast().toasts).toHaveLength(1);
    expect(toast().toasts[0]).toMatchObject({ type: 'success', message: 'Saved' });
    expect(toast().toasts[0].id).toBeTypeOf('string');
  });

  it('auto-dismisses info/success after 3s', () => {
    toast().showToast('info', 'FYI');
    vi.advanceTimersByTime(2999);
    expect(toast().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast().toasts).toHaveLength(0);
  });

  it('keeps errors on screen for 5s', () => {
    toast().showToast('error', 'Boom');
    vi.advanceTimersByTime(3000);
    expect(toast().toasts).toHaveLength(1); // still there at 3s
    vi.advanceTimersByTime(2000);
    expect(toast().toasts).toHaveLength(0);
  });

  it('stacks multiple toasts', () => {
    toast().showToast('info', 'A');
    toast().showToast('error', 'B');
    expect(toast().toasts).toHaveLength(2);
  });
});

describe('dismissToast', () => {
  it('removes a toast by id before its timer fires', () => {
    toast().showToast('info', 'A');
    const id = toast().toasts[0].id;
    toast().dismissToast(id);
    expect(toast().toasts).toHaveLength(0);
  });

  it('ignores an unknown id', () => {
    toast().showToast('info', 'A');
    toast().dismissToast('does-not-exist');
    expect(toast().toasts).toHaveLength(1);
  });
});
