import { BenchNode } from "./BenchNode";

export class BenchContext {

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
}
