import { IBenchExports } from "../util/IBenchExports";
import { BenchNode } from "./BenchNode";
import { ASUtil } from "@assemblyscript/loader";

export class BenchContext {
  constructor() {}
  wasm: (IBenchExports & ASUtil) | null = null;

  root: BenchNode = new BenchNode();

  generateImports(imports: any): any {
    return Object.assign({}, imports, {
      __asbench: {
        reportBenchNode: this.reportBenchNode.bind(this),
      }
    });
  }

  reportBenchNode(strPtr: number, callback: number, isGroup: 1 | 0): void {
    
  }

  getString(ptr: number, defaultValue: string): string {
    return ptr === 0
      ? defaultValue
      : this.wasm!.__getString(ptr);
  }

  run(wasm: ASUtil & IBenchExports): void {
    this.wasm = wasm;

    // explicitly start the module execution
    this.wasm._start();
  }
}
