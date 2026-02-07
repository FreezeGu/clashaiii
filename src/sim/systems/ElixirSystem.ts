/**
 * Elixir-like resource: max 10, regen over time, each card has cost.
 */
export interface ElixirState {
  current: number;
  max: number;
  regenPerSecond: number;
  lastUpdateTime: number;
}

export function createElixirState(max: number, regenPerSecond: number, now: number): ElixirState {
  return {
    current: max,
    max,
    regenPerSecond,
    lastUpdateTime: now,
  };
}

export function canAfford(state: ElixirState, cost: number): boolean {
  return state.current >= cost;
}

export function spend(state: ElixirState, cost: number): boolean {
  if (!canAfford(state, cost)) return false;
  state.current -= cost;
  return true;
}

/**
 * Update elixir by elapsed time. Call each sim step with current sim time.
 */
export function updateElixir(state: ElixirState, now: number): void {
  const elapsed = now - state.lastUpdateTime;
  state.current = Math.min(state.max, state.current + elapsed * state.regenPerSecond);
  state.lastUpdateTime = now;
}
