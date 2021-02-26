/** 1 or 0 */
type bool = 1 | 0;

/**
 * Our web assembly exports function and property definitions
 * provided by `as-bench` benchmark suite
 */
export interface IBenchExports {
  /** Call a function by it's table index. */
  __call(index: number): void;
  __getDefaultCalculateMean(): bool;
  __getDefaultCalculateMedian(): bool;
  __getDefaultCalculateMax(): bool;
  __getDefaultCalculateMin(): bool;
  __getDefaultCalculateVariance(): bool;
  __getDefaultCalculateStdDev(): bool;
  __getDefaultIterationCount(): number;
  __getDefaultMinIterationCount(): number;
  __getDefaultMaxRuntime(): number;
  __ensureRunCount(count: number): void;
  __getRuns(): number;
  __runIterations(
    callback: number,
    beforeEach: number,
    afterEach: number,
    iterations: number,
  ): number;
  __resetRunIndex(): void;
  __mean(): number;
  __median(): number;
  __max(): number;
  __min(): number;
  __variance(): number;
  __stdDev(): number;
  __newI32Array(): number;
}
