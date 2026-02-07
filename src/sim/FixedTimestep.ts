/**
 * Fixed timestep loop for deterministic simulation.
 * Accumulates real elapsed time and steps simulation at SIM_DT.
 */
const DEFAULT_DT = 1 / 60;

export interface FixedTimestepOptions {
  dt?: number;
  maxSteps?: number;
}

export function createFixedTimestep(
  step: (dt: number) => void,
  options: FixedTimestepOptions = {}
) {
  const dt = options.dt ?? DEFAULT_DT;
  const maxSteps = options.maxSteps ?? 5;
  let accumulator = 0;

  return function tick(elapsedMs: number): void {
    accumulator += (elapsedMs / 1000);
    let steps = 0;
    while (accumulator >= dt && steps < maxSteps) {
      step(dt);
      accumulator -= dt;
      steps++;
    }
    if (accumulator > dt * maxSteps) accumulator = dt * maxSteps;
  };
}
