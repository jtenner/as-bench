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
  __getDefaultMaxRuntime(): number;
}
