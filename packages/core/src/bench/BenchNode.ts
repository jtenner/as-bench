export class BenchNode {
  /** The name of this BenchNode. */
  title = "";

  /** Is true when this BenchNode is a group. */
  isGroup = false;

  /** The callback index in wasm. */
  callback = -1;

  /** The callbacks that happen before each benchmark in this BenchNode. */
  beforeEach: number[] = [];

  /** The callbacks that happen after each benchmark in this BenchNode. */
  afterEach: number[] = [];

  /** The callbacks that happen before anything in this BenchNode runs. */
  beforeAll: number[] = [];

  /** The callbacks that happen before anything in this BenchNode runs. */
  afterAll: number[] = [];

  /** The performance runtime values collected by the BenchContext object. */
  runs: number[] = [];

  /** Determine if this node should collect the median runtime of the BenchNode runs. */
  calculateMedian: boolean | null = null;

  /** Determine if this node should collect the mean runtime of the BenchNode runs. */
  calculateMean: boolean | null = null;

  /** Determine if this node should collect the maximum runtime of the BenchNode runs. */
  calculateMaximum: boolean | null = null;

  /** Determine if this node should collect the minimum runtime of the BenchNode runs. */
  calculateMinimum: boolean | null = null;

  /** Determine if this node should collect the variance of the runtimes in this BenchNode. */
  calculateVariance: boolean | null = null;

  /** Determine if this node should collect the standard deviation of the runtimes in this BenchNode. */
  calculateStdDev: boolean | null = null;

  /** The minimum number of iterations this BenchNode must run. */
  minIterationCount: number | null = null;

  /** The maximum number of milliseconds this BenchNode can run. */
  maxRuntime: number | null = null;

  /** The number of iterations per poll. */
  iterationCount: number | null = null;

  /** The starting time for this node. */
  startTime: number = 0;

  /** The ending time for this node. */
  endTime: number = 0;

  /** The total runtime for this node. */
  get runtime(): number {
    return this.endTime - this.startTime;
  }

  /** The calculated mean value in ms. */
  mean: number | null = null;

  /** The calculated median value. */
  median: number | null = null;

  /** The calculated maximum value. */
  maximum: number | null = null;

  /** The calcualted minimum value. */
  minimum: number | null = null;

  /** The calculate variance. */
  variance: number | null = null;

  /** The calculated standard deviation. */
  stdDev: number | null = null;

  /** The children of this BenchNode. */
  children: BenchNode[] = [];

  /** The parent of this BenchNode. */
  parent: BenchNode | null = null;
}
