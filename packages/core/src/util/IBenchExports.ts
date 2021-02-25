/** to Boolean | bool === that is the question */
type bool = 1 | 0;

/**
 * Our web assembly exports function and property definitions
 * provided by `as-bench` benchmark suite
 */
export interface IBenchExports {
  
  /** Call a function by it's table index. */
  __call(index: number): void;
  __getDefaultCalculateMean(): bool;

  /** return calculated value for median average */
  __getDefaultCalculateMedian(): bool;
  __getDefaultCalculateMaximum(): bool;
  __getDefaultCalculateMinimum(): bool;
  __getDefaultCalculateVariance(): bool;

  /** returns calculated difference of mean and result */
  __getDefaultCalculateStdDev(): bool;

  /** returns total bench call's */
  __getDefaultIterationCount(): number;
  __getDefaultMinIterationCount(): number;
  __getDefaultMaxRuntime(): number;

  /** make sure we run this many times*/
  __ensureRunCount(count: number): void;

  /** returns how many times we have ran the bench */
  __getRuns(): number;

  /** runs a test a specified amount */
  __runIterations(
    callback: number,
    beforeEach: number,
    afterEach: number,
    iterations: number,
  ): number;

  /** clears current run indices */
  __resetRunIndex(): void;

  /** calcuation functions for runs */
  __mean(): number;
  __median(): number;
  __maximum(): number;
  __minimum(): number;
  __variance(): number;
  __stdDev(): number;

  /// TODO should be moved into a utility class
  /** 32bit integer helper  */
  __newI32Array(values: number[]): number;
}
