import { IBenchExports } from "../util/IBenchExports";
import { BenchNode } from "./BenchNode";
import { ASUtil } from "@assemblyscript/loader";
import { performance } from "perf_hooks";

const timeout = () => new Promise((resolve) => setImmediate(resolve));

export class BenchContext {
  constructor() {}
  wasm: (IBenchExports & ASUtil) | null = null;

  root: BenchNode = new BenchNode();

  generateImports(imports: any): any {
    return Object.assign({}, imports, {
      __asbench: {
        reportBenchNode: this.reportBenchNode.bind(this),
      },
    });
  }

  reportBenchNode(strPtr: number, callback: number, isGroup: 1 | 0): void {}

  getString(ptr: number, defaultValue: string): string {
    return ptr === 0 ? defaultValue : this.wasm!.__getString(ptr);
  }

  async run(wasm: ASUtil & IBenchExports): void {
    this.wasm = wasm;

    // explicitly start the module execution
    this.wasm._start();

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

    const i32StaticArrayID = this.wasm!.__getStaticArrayI32ID();
    // We need the __pin() method
    const beforeEachArray = this.wasm!.__newArray(i32StaticArrayID, beforeEach);
    this.wasm!.__pin(beforeEachArray);

    const afterEachArray = this.wasm!.__newArray(i32StaticArrayID, afterEach);
    this.wasm!.__pin(afterEachArray);

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

    // 3. unpin the arrays
    // 4. set the start/end and end times
    node.startTime = start;
    node.endTime = end;
    this.wasm!.__unpin(beforeEachArray);
    this.wasm!.__unpin(afterEachArray);
    return true;
  }
}
