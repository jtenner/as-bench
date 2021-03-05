import { Config, parse, Result } from "assemblyscript/cli/util/options";
import { assert, globp } from "./util";
import * as path from "path";
import * as fs from "fs";
import { main } from "assemblyscript/cli/asc";
import { BenchContext, IBenchExports } from "@as-bench/core";
import { ASUtil } from "assemblyscript/lib/loader";

const options: Config = {
  targets: {
    alias: "t",
    category: "configuration",
    default: ["release"],
    description:
      "The set of AssemblyScript compile targets to run the benchmarks against",
    type: "S",
  },
  instantiate: {
    alias: "i",
    category: "configuration",
    default: "./as-bench.js",
    description:
      "The instantiate module file, that configures and instantiates each module",
    type: "s",
  },
  emitBinary: {
    alias: "b",
    category: "configuration",
    default: false,
    description: "Emit the .wasm file. Format is `./build/bench.{target}.wasm`",
    type: "b",
  },
  emitSourcemap: {
    alias: "s",
    category: "configuration",
    default: false,
    description:
      "Emit the .map file. Format is `./build/bench.{target}.wasm.map`",
    type: "b",
  },
  emitText: {
    alias: "w",
    category: "configuration",
    default: false,
    description: "Emit the .wat file. Format is `./build/bench.{target}.wat`",
    type: "b",
  },
};

/** The cli entry point. */
export async function asb(argv: string[]): Promise<void> {
  // TODO: show ascii art immediately

  const parsed = parse(argv, options);

  const targets = (parsed.options.targets as unknown) as string[];
  // check to assert targets were specified
  assert(targets.length > 0, "No targets specified. Benchmark fails.");

  // await every glob, create a unique set of each entry point
  const entries = new Set(
    ([] as string[]).concat.apply(
      [],
      await Promise.all(parsed.arguments.map(globp)),
    ),
  );
  assert(entries.size > 0, "No entry points found. Benchmark suite fails.");

  const resolvedInstantiateModule = path.resolve(
    (options.instantiate as unknown) as string,
  );
  assert(
    fs.existsSync(resolvedInstantiateModule),
    "No valid module found to instantiate benchmarks. Benchmark fails.",
  );

  const instantiate = require(resolvedInstantiateModule);
  assert(
    typeof instantiate === "function",
    "Instantiate module must export a single function. Benchmark fails.",
  );

  entries.add(require.resolve("@as-bench/assembly/assembly/index.ts"));

  let contexts: Array<BenchContext> = [];
  for (const target of targets) {
    performBenchmark(
      parsed,
      Array.from(entries),
      target,
      instantiate,
      (ctx) => {
        contexts.push(ctx);
      },
    );
  }

  for (const ctx of contexts) {
    await ctx.run();
  }
}

function performBenchmark(
  options: Result,
  entries: string[],
  target: string,
  instantiate: any,
  callback: (result: BenchContext) => void,
): void {
  let binary: Uint8Array;
  main(
    ["--target", target].concat(entries),
    {
      stderr: process.stderr,
      stdout: process.stdout,
      writeFile(name, contents, _baseDir) {
        const extname = path.extname(name);
        switch (extname) {
          case ".wasm": {
            binary = contents;
            if (options.options.emitBinary) {
              fs.writeFileSync(`./build/bench.${target}.wasm`, contents);
            }
            break;
          }
          case ".wat": {
            if (options.options.emitText) {
              fs.writeFileSync(`./build/bench.${target}.wat`, contents);
            }
            break;
          }
          case ".map": {
            if (options.options.emitSourcemap) {
              fs.writeFileSync(`./build/bench.${target}.wasm.map`, contents);
            }
            break;
          }
        }
      },
    },
    (err) => {
      if (err) assert(false, err.toString());

      const ctx = new BenchContext();
      const mod = instantiate(binary, (imports: any) =>
        ctx.generateImports(imports),
      ) as ASUtil & IBenchExports;
      ctx.setWasm(mod);
      callback(ctx);
      return 0;
    },
  );
}
