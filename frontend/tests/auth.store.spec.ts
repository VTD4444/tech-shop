import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../stores/auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts unauthenticated', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
  });

  it('clearSession resets user without localStorage tokens', () => {
    const store = useAuthStore();
    store.user = {
      id: '1',
      username: 'tester',
      role: 'customer',
    };
    store.clearSession();
    expect(store.user).toBeNull();
    expect(store.bootstrapped).toBe(true);
  });
});
