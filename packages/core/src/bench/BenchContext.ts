import { IBenchExports } from "../util/IBenchExports";
import { BenchNode } from "./BenchNode";
import { ASUtil } from "assemblyscript/lib/loader";
import { performance } from "perf_hooks";

/** Promise change that is used  */
const timeout = () => new Promise<void>((resolve) => setImmediate(resolve));

/**
 * The root class that handles and manages our Benchmark session. The context
 * is responsible for registering our wasm instance, import API, and walking
 * the bench tree hiearchy. It also slices and dices, while executing
 * recursive benchmarks
 */
export class BenchContext {
  constructor() {}

  /** The web assembly instance for this benchmark module. */
  wasm: (ASUtil & IBenchExports) | null = null;

  /** The web assembly memory associated with this benchmark suite. */
  memory: WebAssembly.Memory | undefined = undefined;

  ///////////////////////////////////////////////////////////
  /// Tree BenchNode values
  ///////////////////////////////////////////////////////////
  /** The root benchnode, represents all the benchmarks collected at the top level. */
  root: BenchNode = new BenchNode();
  /** When doing a visiting pattern, the node we are currently visiting. */
  private currentNode: BenchNode = this.root;

  ///////////////////////////////////////////////////////////
  /// Effective and Default Configuation Values
  ///////////////////////////////////////////////////////////
  /// Each one of the following sets of properties can be
  /// configured for each benchmark individually by calling
  /// their respective functions in assemblyscript. We can
  /// collect this information up front, before the node
  /// itself is reported, populate the node with it's
  /// contextual information, and then reset the effective
  /// properties for later use.
  ///////////////////////////////////////////////////////////

  /** This node's calculate mean configuration value. */
  private effectiveCalculateMean: boolean | null = null;
  /** The default calculate mean configuration value. */
  private defaultCalculateMean: boolean | null = null;
  /** This node's calculate median configuration value. */
  private effectiveCalculateMedian: boolean | null = null;
  /** The default calculate median configuration value. */
  private defaultCalculateMedian: boolean | null = null;
  /** This node's calculate max configuration value. */
  private effectiveCalculateMaximum: boolean | null = null;
  /** The default calculate max configuration value. */
  private defaultCalculateMaximum: boolean | null = null;
  /** This node's calculate min configuration value. */
  private effectiveCalculateMinimum: boolean | null = null;
  /** The default calculate min configuration value. */
  private defaultCalculateMinimum: boolean | null = null;
  /** This node's calculate variance configuration value. */
  private effectiveCalculateVariance: boolean | null = null;
  /** The default calculate variance configuration value. */
  private defaultCalculateVariance: boolean | null = null;
  /** This node's calculate standard deviation configuration value. */
  private effectiveCalculateStdDev: boolean | null = null;
  /** The default calculate standard deviation configuration value. */
  private defaultCalculateStdDev: boolean | null = null;

  /** This node's effective iteration count. */
  private effectiveIterationCount: number | null = null;
  /** The default iteration count. */
  private defaultIterationCount: number | null = null;
  /** This node's effective minimum iteration count. */
  private effectiveMinIterationCount: number | null = null;
  /** The default minimum iteration count. */
  private defaultMinIterationCount: number | null = null;
  /** This node's effective max runtime. */
  private effectiveMaxRuntime: number | null = null;
  /** This default max runtime. */
  private defaultMaxRuntime: number | null = null;

  ///////////////////////////////////////////////////////////
  /// Public methods
  ///////////////////////////////////////////////////////////

  /** This function mixes in the functions required to sets up our import graph for wasm instance */
  public generateImports(imports: any): any {
    return Object.assign({}, imports, {
      performance,
      __asbench: {
        reportBenchNode: this.reportBenchNode.bind(this),
        setCalculateMean: this.setCalculateMean.bind(this),
        setCalculateMedian: this.setCalculateMedian.bind(this),
        setCalculateMaximum: this.setCalculateMaximum.bind(this),
        setCalculateMinimum: this.setCalculateMinimum.bind(this),
        setCalculateVariance: this.setCalculateVariance.bind(this),
        setCalculateStdDev: this.setCalculateStdDev.bind(this),
        setMinimumIterationCount: this.setMinimumIterationCount.bind(this),
        setIterationCount: this.setIterationCount.bind(this),
        setMaxRuntime: this.setMaxRuntime.bind(this),
      },
    });
  }

  /** Run our WebAssembly instance and set default configuration */
  public async run(wasm: ASUtil & IBenchExports): Promise<void> {
    this.wasm = wasm;
    this.memory = wasm.memory;

    // explicitly start the module execution
    this.wasm._start();

    // get the default values for all the configuration elements
    this.defaultCalculateMean = this.wasm!.__getDefaultCalculateMean() === 1;
    this.defaultCalculateMedian =
      this.wasm!.__getDefaultCalculateMedian() === 1;
    this.defaultCalculateMaximum =
      this.wasm!.__getDefaultCalculateMaximum() === 1;
    this.defaultCalculateMinimum =
      this.wasm!.__getDefaultCalculateMinimum() === 1;
    this.defaultCalculateVariance =
      this.wasm!.__getDefaultCalculateVariance() === 1;
    this.defaultCalculateStdDev =
      this.wasm!.__getDefaultCalculateStdDev() === 1;
    this.defaultIterationCount = this.wasm!.__getDefaultIterationCount();
    this.defaultMinIterationCount = this.wasm!.__getDefaultMinIterationCount();
    this.defaultMaxRuntime = this.wasm!.__getDefaultMaxRuntime();

    // wait for node tree walker to explore each node
    await this.visit(this.root);
  }

  ///////////////////////////////////////////////////////////
  /// Private methods consumed by wasm and the class itself
  ///////////////////////////////////////////////////////////

  /** queries our bench node from tree and updates its properties before running */
  private reportBenchNode(
    strPtr: number,
    callback: number,
    isGroup: 1 | 0,
  ): void {
    // report that a group/benchmark needs to be addressed
    const node = new BenchNode();
    const currentNode = this.currentNode;

    // set initial properties
    node.parent = currentNode;
    node.isGroup = isGroup === 1;
    node.callback = callback;
    node.title = this.getString(strPtr, "Benchmark Name is null");

    // collect this node's configuration
    node.calculateMean = this.effectiveCalculateMean;
    node.calculateMedian = this.effectiveCalculateMedian;
    node.calculateMaximum = this.effectiveCalculateMaximum;
    node.calculateMinimum = this.effectiveCalculateMinimum;
    node.calculateVariance = this.effectiveCalculateVariance;
    node.calculateStdDev = this.effectiveCalculateStdDev;
    node.iterationCount = this.effectiveIterationCount;
    node.maxRuntime = this.effectiveMaxRuntime;
    node.minIterationCount = this.effectiveMinIterationCount;

    // append it to the current node's children
    currentNode.children.push(node);

    // if it's a group node, we need to visit it's children immediately
    if (isGroup === 1) {
      this.currentNode = node;
      this.wasm!.__call(callback);
      this.currentNode = currentNode;
    }

    // these values only apply to the node being generated
    this.effectiveCalculateMean = null;
    this.effectiveCalculateMedian = null;
    this.effectiveCalculateMaximum = null;
    this.effectiveCalculateMinimum = null;
    this.effectiveCalculateVariance = null;
    this.effectiveCalculateStdDev = null;
    this.effectiveIterationCount = null;
    this.effectiveMinIterationCount = null;
    this.effectiveMaxRuntime = null;
  }

  /// TODO Should be part of a static utility class
  /** Helper function used translate string pointer into literal string for js */
  private getString(ptr: number, defaultValue: string): string {
    const buff = Buffer.from(this.memory!.buffer);
    if (ptr === 0) return defaultValue;
    const byteLength = buff.readUInt32LE(ptr - 32);
    return buff.toString("utf16le", ptr, byteLength);
  }

  /** Bench node tree explorer */
  private async visit(node: BenchNode): Promise<boolean> {
    if (node.isGroup) {
      // beforeAll callbacks get called once
      for (let i = 0; i < node.beforeAll.length; i++) {
        this.wasm!.__call(node.beforeAll[i]);
      }

      // visit all of the node's child nodes recursively
      for (const child of node.children) {
        const result = await this.visit(child);
        if (!result) return false;
      }

      // beforeAll callbacks get called once
      for (let i = 0; i < node.afterAll.length; i++) {
        this.wasm!.__call(node.afterAll[i]);
      }
    } else {
      return this.evaluate(node);
    }
    return true;
  }

  /** evaluate our visits to bench tree and execute run procedure */
  private async evaluate(node: BenchNode): Promise<boolean> {
    /// All of these methods require a context, which is the node itself
    const beforeEach = this.getBeforeEach(node); // TODO make Array
    const afterEach = this.getAfterEach(node); // TODO make Array
    const maxRuntime = this.getMaxRuntime(node);
    const minIterations = this.getMinIterationCount(node);
    const iterationCount = this.getIterationCount(node);
    const calculateMean = this.getCalculateMean(node);
    const calculateMedian = this.getCalculateMedian(node);
    const calculateMaximum = this.getCalculateMaximum(node);
    const calculateMinimum = this.getCalculateMinimum(node);
    const calculateVariance = this.getCalculateVariance(node);
    const calculateStdDev = this.getCalculateStdDev(node);

    // This method returns a pinned array, must unpin it later
    const beforeEachArray = this.newI32Array(beforeEach);
    const afterEachArray = this.newI32Array(afterEach);

    // set the count to 0
    let count = 0;
    this.wasm!.__resetRunIndex();

    // start runtime for the entire node
    const start = performance.now();
    try {
      while (true) {
        const now = performance.now();
        // respect max runtime first and foremost
        if (now > start + maxRuntime) break;
        // ensure that the array has enough space to store the run times
        this.wasm!.__ensureRunCount(count + iterationCount);

        // the iteration count to the official count
        count += this.wasm!.__runIterations(
          // the index
          node.callback,
          beforeEachArray,
          afterEachArray,
          iterationCount,
        );

        // finally, check to see if we have run enough iterations to satisfy the minIterations
        if (count > minIterations) break;
        await timeout();
      }
    } catch (exception) {
      // we stop execution all the way up the stack
      return false;
    }
    // end runtime for the entire node
    const end = performance.now();
    // TODO: Finalization of the node
    // 1. get all the runtimes via the memory
    node.runs = Array.from(
      new Float64Array(
        this.wasm!.memory!.buffer,
        this.wasm!.__getRuns(),
        iterationCount,
      ),
    );

    // 2. obtain each property from wasm calculations
    if (calculateMean) node.mean = this.wasm!.__mean();
    if (calculateMedian) node.median = this.wasm!.__median();
    if (calculateMaximum) node.maximum = this.wasm!.__maximum();
    if (calculateMinimum) node.minimum = this.wasm!.__minimum();
    if (calculateVariance) node.variance = this.wasm!.__variance();
    if (calculateStdDev) node.stdDev = this.wasm!.__stdDev();

    // 3. unpin the arrays, they can be collected by AS now
    this.wasm!.__unpin(beforeEachArray);
    this.wasm!.__unpin(afterEachArray);

    // 4. set the start/end and end times
    node.startTime = start;
    node.endTime = end;

    return true;
  }

  /// TODO move into static utility class
  /** use custom initializer to populate buffer array in assembly **/
  private newI32Array(values: number[]): number {
    const length: number = values.length,
      $arr = this.wasm!.__newI32Array(length),
      buffer = Buffer.from(this.wasm!.memory!.buffer);

    this.wasm!.__pin($arr);
    for (let i = 0; i < length; i++) {
      buffer.writeInt32LE(values[i], $arr + (i << 3));
    }
    return $arr;
  }

  /** enable our node to collect mean values */
  private setCalculateMean(value: 1 | 0): void {
    this.effectiveCalculateMean = value === 1;
  }

  /** enable our node to collect median values */
  private setCalculateMedian(value: 1 | 0): void {
    this.effectiveCalculateMedian = value === 1;
  }

  /** enable our node to collect maximum values */
  private setCalculateMaximum(value: 1 | 0): void {
    this.effectiveCalculateMaximum = value === 1;
  }

  /** enable our node to collect minimum values */
  private setCalculateMinimum(value: 1 | 0): void {
    this.effectiveCalculateMinimum = value === 1;
  }

  /** enable our node to collect variance values */
  private setCalculateVariance(value: 1 | 0): void {
    this.effectiveCalculateVariance = value === 1;
  }

  /** enable our node to collect standard deviation values */
  private setCalculateStdDev(value: 1 | 0): void {
    this.effectiveCalculateStdDev = value === 1;
  }

  /** set the minimum number of iterations for this node and it's children. */
  private setMinimumIterationCount(count: number): void {
    this.effectiveMinIterationCount = count;
  }

  /** set the number of iterations per poll for this node and it's children. */
  private setIterationCount(count: number): void {
    this.effectiveIterationCount = count;
  }

  /** set the number of iterations per poll for this node and it's children. */
  private setMaxRuntime(count: number): void {
    this.effectiveMaxRuntime = count;
  }

  /** Obtain every beforeEach function index for the given node. */
  private getBeforeEach(node: BenchNode): number[] {
    const result = [];
    let currentNode: BenchNode | null = node;
    while (currentNode) {
      for (let i = 0; i < node.beforeEach.length; i++) {
        result.push(currentNode.beforeEach[i]);
      }
      currentNode = node.parent;
    }
    return result;
  }

  /** Obtain every beforeEach function index for the given node. */
  private getAfterEach(node: BenchNode): number[] {
    const result = [];
    let currentNode: BenchNode | null = node;
    while (currentNode) {
      for (let i = 0; i < node.afterEach.length; i++) {
        result.push(currentNode.afterEach[i]);
      }
      currentNode = node.parent;
    }
    return result;
  }

  /** Obtain the effective iterationCount configuration value for the given node. */
  private getIterationCount(node: BenchNode): number {
    let currentNode: BenchNode | null = node;
    while (currentNode) {
      if (currentNode.iterationCount !== null)
        return currentNode.iterationCount;
      currentNode = currentNode.parent;
    }
    return this.defaultIterationCount!;
  }

  /** Obtain the effective maximum runtime configuration value for the given node. */
  private getMaxRuntime(node: BenchNode): number {
    let currentNode: BenchNode | null = node;
    while (currentNode) {
      if (currentNode.maxRuntime !== null) return currentNode.maxRuntime;
      currentNode = currentNode.parent;
    }
    return this.defaultMaxRuntime!;
  }

  /** Obtain the effective maximum runtime configuration value for the given node. */
  private getMinIterationCount(node: BenchNode): number {
    let currentNode: BenchNode | null = node;
    while (currentNode) {
      if (currentNode.minIterationCount !== null)
        return currentNode.minIterationCount;
      currentNode = currentNode.parent;
    }
    return this.defaultMinIterationCount!;
  }

  /** Obtain the effective calculate mean configuration value for the given node. */
  private getCalculateMean(node: BenchNode): boolean {
    let currentNode: BenchNode | null = node;
    while (currentNode) {
      if (currentNode.calculateMean !== null) return currentNode.calculateMean;
      currentNode = currentNode.parent;
    }
    return this.defaultCalculateMean!;
  }

  /** Obtain the effective calculate median configuration value for the given node. */
  private getCalculateMedian(node: BenchNode): boolean {
    let currentNode: BenchNode | null = node;
    while (currentNode) {
      if (currentNode.calculateMedian !== null)
        return currentNode.calculateMedian;
      currentNode = currentNode.parent;
    }
    return this.defaultCalculateMedian!;
  }

  /** Obtain the effective calculate maximum configuration value for the given node. */
  private getCalculateMaximum(node: BenchNode): boolean {
    let currentNode: BenchNode | null = node;
    while (currentNode) {
      if (currentNode.calculateMaximum !== null)
        return currentNode.calculateMaximum;
      currentNode = currentNode.parent;
    }
    return this.defaultCalculateMaximum!;
  }

  /** Obtain the effective calculate maximum configuration value for the given node. */
  private getCalculateMinimum(node: BenchNode): boolean {
    let currentNode: BenchNode | null = node;
    while (currentNode) {
      if (currentNode.calculateMinimum !== null)
        return currentNode.calculateMinimum;
      currentNode = currentNode.parent;
    }
    return this.defaultCalculateMinimum!;
  }

  /** Obtain the effective calculate variance configuration value for the given node. */
  private getCalculateVariance(node: BenchNode): boolean {
    let currentNode: BenchNode | null = node;
    while (currentNode) {
      if (currentNode.calculateVariance !== null)
        return currentNode.calculateVariance;
      currentNode = currentNode.parent;
    }
    return this.defaultCalculateVariance!;
  }

  /** Obtain the effective calculate standard deviation configuration value for the given node. */
  private getCalculateStdDev(node: BenchNode): boolean {
    let currentNode: BenchNode | null = node;
    while (currentNode) {
      if (currentNode.calculateStdDev !== null)
        return currentNode.calculateStdDev;
      currentNode = currentNode.parent;
    }
    return this.defaultCalculateStdDev!;
  }
}
