import { IBenchExports } from "../util/IBenchExports";
import { BenchNode } from "./BenchNode";
import { ASUtil } from "@assemblyscript/loader";
import { performance } from "perf_hooks";

const timeout = () => new Promise((resolve) => setImmediate(resolve));

export class BenchContext {
  constructor() {}
  wasm: (IBenchExports & ASUtil) | null = null;

  root: BenchNode = new BenchNode();
  currentNode: BenchNode = this.root;

  effectiveCalculateMean: boolean | null = null;
  defaultCalculateMean: boolean | null = null;

  generateImports(imports: any): any {
    return Object.assign({}, imports, {
      performance,
      __asbench: {
        reportBenchNode: this.reportBenchNode.bind(this),
        setCalculateMean: this.setCalculateMean.bind(this),
      },
    });
  }

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
  }

  getString(ptr: number, defaultValue: string): string {
    return ptr === 0 ? defaultValue : this.wasm!.__getString(ptr);
  }

  async run(wasm: ASUtil & IBenchExports): Promise<void> {
    this.wasm = wasm;

    // explicitly start the module execution
    this.wasm._start();

    // get the default value
    this.defaultCalculateMean = this.wasm!.__getDefaultCalculateMean() === 1;

    await this.visit(this.root);
  }

  async visit(node: BenchNode): Promise<boolean> {
    if (node.isGroup) {
      // beforeAll callbacks get called once
      for (let i = 0; i < node.beforeAll.length; i++) {
        this.wasm!.__call(node.beforeAll[i]);
      }

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

  async evaluate(node: BenchNode): Promise<boolean> {
    const beforeEach = this.getBeforeEach(node);
    const afterEach = this.getAfterEach(node);
    const maxRuntime = this.getMaxRuntime(node);
    const minIterations = this.getMinIterations(node);
    const iterationCount = this.getIterationCount(node);
    const calculateMean = this.getCalculateMean(node);
    const calculateMedian = this.getCalculateMedian(node);
    const calculateMax = this.getCalculateMax(node);
    const calculateMin = this.getCalculateMin(node);
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
        // TODO: Do we really need a finished flag?
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
    if (calculateMax) node.max = this.wasm!.__max();
    if (calculateMin) node.min = this.wasm!.__min();
    if (calculateStdDev) node.stdDev = this.wasm!.__stdDev();
    if (calculateVariance) node.variance = this.wasm!.__variance();

    // 3. unpin the arrays
    this.wasm!.__unpin(beforeEachArray);
    this.wasm!.__unpin(afterEachArray);

    // 4. set the start/end and end times
    node.startTime = start;
    node.endTime = end;

    return true;
  }

  newI32Array(values: number[]): number {
    const ptr = this.wasm!.__newI32Array(values.length);
    this.wasm!.__pin(ptr);
    const buffer = Buffer.from(this.wasm!.memory!.buffer);
    for (let i = 0; i < values.length; i++) {
      buffer.writeInt32LE(
        values[i],
        ptr + (i << 3)
      );
    }
    return ptr;
  }

  setCalculateMean(value: 1 | 0): void {
    this.effectiveCalculateMean = value === 1;
  }
}
