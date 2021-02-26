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

    // We need the __pin() method
    const beforeEachArray = this.wasm!.__newArray(
      this.wasm.__getStaticArrayU32ID(),
      beforeEach,
    );
    this.wasm!.__pin(beforeEachArray);

    const afterEachArray = this.wasm!.__newArray(
      this.wasm.__getStaticArrayU32ID(),
      afterEach,
    );
    this.wasm!.__pin(afterEachArray);
    const start = performance.now();

    try {
      while (true) {
        const now = performance.now();
        if (now > start + maxRuntime) break;
        const count = this.wasm!.__runIterations(
          // the index
          node.callback,
          beforeEachArray,
          afterEachArray,
          iterationCount,
        );
        if (count > minIterations) break;
        await timeout();
        if (this.finished) break;
      }
    } catch (exception) {
      return false;
    }
    return true;
  }
}
