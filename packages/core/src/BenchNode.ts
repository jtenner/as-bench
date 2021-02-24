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

  /** The minimum number of iterations this BenchNode must run. */
  minIterations: number | null = null;

  /** The maximum number of iterations this BenchNode can run. */
  maxIterations: number | null = null;

  /** The minimum amount of milliseconds this BenchNode must run. */
  minRuntime: number | null = null;

  /** The maximum number of milliseconds this BenchNode can run. */
  maxRuntime: number | null = null;

  /** Useful for eventually calculating the standard deviation. */
  private calculatedVariance: number | null = null;

  /** Actually calculate the mean value in ms. */
  get mean(): number {
    if (this.runs.length === 0) return NaN;
    const runs = this.runs;
    const length = runs.length;
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += runs[i];
    }
    return sum / length;
  }

  /** Actually calculate the median value. */
  get median(): number {
    if (this.runs.length === 0) return NaN;
    const length = this.runs.length;
    const odd = length & 1;
    const halfLength = length / 2;
    this.runs.sort();
    return odd === 1
      ? this.runs[Math.ceil(halfLength)]
      : (this.runs[halfLength] + this.runs[halfLength + 1]) / 2;
    ;
  }

  /** Actually calculate the max value. */
  get max(): number {
    if (this.runs.length === 0) return NaN;
    let max = 0;
    for (let i = 0; i < this.runs.length; i++) {
      let value = this.runs[i];
      if (value > max) max = value;
    }
    return max;
  }

  /** Actually calculate the min value. */
  get min(): number {
    if (this.runs.length === 0) return NaN;
    let min = this.runs[0];
    for (let i = 1; i < this.runs.length; i++) {
      let value = this.runs[i];
      if (value < min) min = value;
    }
    return min;
  }

  /** Actually calculate the variance value. */
  get variance(): number {
    if (this.calculatedVariance !== null) return this.calculatedVariance;
    var avg = this.mean,
      length = this.runs.length,
      i = length,
      v = 0;

    while( i-- ){
      v += Math.pow( (this.runs[ i ] - avg), 2 );
    }
    v /= length;

    return this.calculatedVariance = v;
  }

  /** Actually calculate the variance value. */
  get stdDev(): number { return Math.sqrt(this.variance); }

  /** The children of this BenchNode. */
  children: BenchNode[] = [];

  /** The parent of this BenchNode. */
  parent: BenchNode | null = null;
}
