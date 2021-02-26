import { IBenchExports } from "../util/IBenchExports";
import { BenchNode } from "./BenchNode";
import { ASUtil } from "assemblyscript/lib/loader";
import { performance } from "perf_hooks";

/** Promise change that is used  */
const timeout = () => new Promise((resolve) => setImmediate(resolve));

/**
 * The root class that handles and manages our Benchmark session. The context
 * is responsible for registering our wasm instance, import API, and walking
 * the bench tree hiearchy. It also slices and dices, while executing
 * recursive benchmarks
 */
export class BenchContext {
  constructor() {}

  /** The web assembly instance for this benchmark module. */
  wasm: (WebAssembly.Instance & ASUtil & IBenchExports) | null = null;
  /** The web assembly memory associated with this benchmark suite. */
  memory: WebAssembly.Memory | undefined = undefined;

  /** Cast the exports as IBenchExports. */
  get exports(): IBenchExports {
    return (this.wasm!.exports as unknown) as IBenchExports;
  }

  /** The root benchnode, represents all the benchmarks collected at the top level. */
  root: BenchNode = new BenchNode();
  currentNode: BenchNode = this.root;

  effectiveCalculateMean: boolean | null = null;
  defaultCalculateMean: boolean | null = null;

  effectiveCalculateMedian: boolean | null = null;
  defaultCalculateMedian: boolean | null = null;

  effectiveCalculateMaximum: boolean | null = null;
  defaultCalculateMaximum: boolean | null = null;

  effectiveCalculateMinimum: boolean | null = null;
  defaultCalculateMinimum: boolean | null = null;

  effectiveCalculateVariance: boolean | null = null;
  defaultCalculateVariance: boolean | null = null;

  effectiveCalculateStdDev: boolean | null = null;
  defaultCalculateStdDev: boolean | null = null;

  // TODO implement default config for min/max itr and max runtime

  /** helper function that sets up our import graph for wasm instance */
  generateImports(imports: any): any {
    return Object.assign({}, imports, {
      performance,
      __asbench: {
        reportBenchNode: this.reportBenchNode.bind(this),
        setCalculateMean: this.setCalculateMean.bind(this),
        setCalculateMedian: this.setCalculateMedian.bind(this),
        setCalculateMaximum: this.setCalculateMaximum.bind(this),
        setCalculateMinimum: this.setCalculateMaximum.bind(this),
        setCalculateVariance: this.setCalculateVariance.bind(this),
        setCalculateStdDev: this.setCalculateStdDev.bind(this),
      },
    });
  }

  /** queries our bench node from tree and updates its properties before running */
  reportBenchNode(strPtr: number, callback: number, isGroup: 1 | 0): void {
    // report that a group/benchmark needs to be addressed
    const node = new BenchNode();
    const currentNode = this.currentNode;

    // set initial properties
    node.parent = currentNode;
    node.isGroup = isGroup === 1;
    node.callback = callback;
    node.title = this.getString(strPtr, "Benchmark Name is null");

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
  }

  /// TODO Should be part of a static utility class
  /** Helper function used translate string pointer into literal string for js */
  getString(ptr: number, defaultValue: string): string {
    const buff = Buffer.from(this.memory!.buffer);
    if (ptr === 0) return defaultValue;
    const byteLength = buff.readUInt32LE(ptr - 32);
    return buff.toString("utf16le", ptr, byteLength);
  }

  /** Run our WebAssembly instance and set default configuration */
  async run(
    wasm: WebAssembly.Instance & ASUtil & IBenchExports,
  ): Promise<void> {
    this.wasm = wasm;
    this.memory = wasm.memory;

    // explicitly start the module execution
    this.wasm._start();

    // get the default value
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

    // wait for node tree walker to explore each node
    await this.visit(this.root);
  }

  /** Bench node tree explorer */
  async visit(node: BenchNode): Promise<boolean> {
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
  async evaluate(node: BenchNode): Promise<boolean> {
    /// TODO create getters to access these
    const beforeEach = this.getBeforeEach(node); // TODO make Array
    const afterEach = this.getAfterEach(node); // TODO make Array
    const maxRuntime = this.getMaxRuntime(node);
    const minIterations = this.getMinIterations(node);
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
        if (now > start + maxRuntime) break;
        this.wasm!.__ensureRunCount(count + iterationCount);

        // the iteration count to the official count
        count += this.wasm!.__runIterations(
          // the index
          node.callback,
          beforeEachArray,
          afterEachArray,
          iterationCount,
        );
        if (count > minIterations) break;
        await timeout();
        // TODO: Do we really need a finished flag? -- not if we properly await while wasm iterates.
        // if (this.finished) break;
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

    // 3. unpin the arrays
    this.wasm!.__unpin(beforeEachArray);
    this.wasm!.__unpin(afterEachArray);

    // 4. set the start/end and end times
    node.startTime = start;
    node.endTime = end;

    return true;
  }

  /// TODO move into static utility class
  /** use custom initializer to populate buffer array in assembly **/
  newI32Array(values: number[]): number {
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
  setCalculateMean(value: 1 | 0): void {
    this.effectiveCalculateMean = value === 1;
  }

  /** enable our node to collect median values */
  setCalculateMedian(value: 1 | 0): void {
    this.effectiveCalculateMedian = value === 1;
  }

  /** enable our node to collect maximum values */
  setCalculateMaximum(value: 1 | 0): void {
    this.effectiveCalculateMaximum = value === 1;
  }

  /** enable our node to collect minimum values */
  setCalculateMinimum(value: 1 | 0): void {
    this.effectiveCalculateMinimum = value === 1;
  }

  /** enable our node to collect variance values */
  setCalculateVariance(value: 1 | 0): void {
    this.effectiveCalculateVariance = value === 1;
  }

  /** enable our node to collect standard deviation values */
  setCalculateStdDev(value: 1 | 0): void {
    this.effectiveCalculateStdDev = value === 1;
  }

  // TODO implement functions min iteration

  // TODO implement function max iteration

  // TODO implement function max run time

  /// NOTES: consider creating globals/ constants static class
  ///        to keep track of some of these default values.
}
