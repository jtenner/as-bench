/**
 * A configuration class used to store a bench's settings for
 * how to run the benchmark
 */
export class BenchConfig {
  constructor() {}

  /** mininmum amount of times to run */
  minIterations: number = 1000;

  /** maximum amount of times to run */
  maxIterations: number = 1000000;

  /** maximum time to run */
  maxRuntimeMs: number = 1000;
}
