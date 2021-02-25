import { IBenchExports } from "../util/IBenchExports";
import { BenchNode } from "./BenchNode";

/** The context for all the benchmarks to run. */
export class BenchContext {
  constructor() {}

  /** The web assembly instance for this benchmark module. */
  wasm: WebAssembly.Instance | null = null;
  /** The web assembly memory associated with this benchmark suite. */
  memory: WebAssembly.Memory | null = null;

  /** Cast the exports as IBenchExports. */
  get exports(): IBenchExports {
    return (this.wasm!.exports as unknown) as IBenchExports;
  }

  /** The root benchnode, represents all the benchmarks collected at the top level. */
  root: BenchNode = new BenchNode();

  /** A function to generate the web assembly imports. */
  generateImports(imports: any): any {
    return Object.assign({}, imports, {
      __asbench: {
        reportBenchNode: this.reportBenchNode.bind(this),
      },
    });
  }

  /** This function is imported in the benchmark binary. */
  reportBenchNode(strPtr: number, callback: number, isGroup: 1 | 0): void {}

  /**
   * Obtain a straing from the wasm module. AssemblyScript uses utf16le as the encoding.
   * @param ptr - The string pointer.
   * @param defaultValue - A value to return if it's a null assemblyscript string
   */
  getString(ptr: number, defaultValue: string): string {
    const buff = Buffer.from(this.memory!.buffer);
    if (ptr === 0) return defaultValue;
    const byteLength = buff.readUInt32LE(ptr - 32);
    return buff.toString("utf16le", ptr, byteLength);
  }

  /** Run the web assembly instance _start() method and run all the benchmarks. */
  run(wasm: WebAssembly.Instance, memory: WebAssembly.Memory): void {
    this.wasm = wasm;
    this.memory = memory;

    // explicitly start the module execution
    this.exports._start();
  }
}
