/** 1 or 0 */
type bool = 1 | 0;

/**
 * Our web assembly exports function and property definitions
 * provided by `as-bench` benchmark suite
 */
export interface IBenchExports {
  
  /** Call a function by it's table index. */
  __call(index: number): void;
  
  /** The explicit start function. */
  _start(): void;
  
  /** return calculated value for mean average */
  __getDefaultCalculateMean(): bool;

  /** return calculated value for median average */
  __getDefaultCalculateMedian(): bool;

  /** returns calculated value for maximum result */
  __getDefaultCalculateMax(): bool;

  /** returns calculated minimum result value */
  __getDefaultCalculateMin(): bool;

  /** returns calculates average of mean differences */
  __getDefaultCalculateVariance(): bool;

  /** returns calculated difference of mean and result */
  __getDefaultCalculateStdDev(): bool;

  /** returns total bench call's */
  __getDefaultIterationCount(): number;

  /** returns total bench execution time */
  __getDefaultMaxRuntime(): number;
}
