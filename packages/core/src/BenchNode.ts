export class BenchNode {
  /** The name of this BenchNode. */
  title: string = "";

  /** Is true when this BenchNode is a group. */
  isGroup: boolean = false;

  /** The callback index in wasm. */
  callback: number = -1;

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
  collectMedian: boolean | null = null;

  /** Determine if this node should collect the mean runtime of the BenchNode runs. */
  collectMean: boolean | null = null;

  /** Determine if this node should collect the maximum runtime of the BenchNode runs. */
  collectMax: boolean | null = null;

  /** Determine if this node should collect the minimum runtime of the BenchNode runs. */
  collectMin: boolean | null = null;

  /** Determine if this node should collect the variance of the runtimes in this BenchNode. */
  collectVariance: boolean | null = null;

  /** Determine if this node should collect the standard deviation of the runtimes in this BenchNode. */
  collectStdDev: boolean | null = null;

  /** Useful for eventually calculating the standard deviation. */
  private calculatedVariance: number | null = null;

  /** Actually calculate the mean value. */
  get mean(): number { return 0; }

  /** Actually calculate the median value. */
  get median(): number { return 0; }

  /** Actually calculate the max value. */
  get max(): number { return 0; }

  /** Actually calculate the min value. */
  get min(): number { return 0; }

  /** Actually calculate the variance value. */
  get variance(): number { return 0; }

  /** Actually calculate the variance value. */
  get stdDev(): number { return 0; }

  /** The children of this BenchNode. */
  children: BenchNode[] = [];

  /** The parent of this BenchNode. */
  parent: BenchNode | null = null;
}
