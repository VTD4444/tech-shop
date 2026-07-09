/** Terminal order statuses — no further transitions */
export const TERMINAL_ORDER_STATUSES = new Set(['delivered', 'cancelled', 'completed']);

/** Valid forward transitions (legacy `completed` may transition to `delivered`) */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  completed: ['delivered'],
};

/** Statuses that unlock product ratings (includes legacy `completed`) */
export const RATEABLE_ORDER_STATUSES = ['delivered', 'completed'] as const;

export function assertOrderStatusTransition(current: string, next: string): void {
  if (current === next) return;
  const allowed = ORDER_STATUS_TRANSITIONS[current];
  if (!allowed?.includes(next)) {
    throw new Error(`INVALID_ORDER_STATUS_TRANSITION:${current}:${next}`);
  }
}
