# 🛋️ as-bench

## Benchmark Your AssemblyScript Software Meaningfully

### About

**Bench** is an [_AssemblyScript_](https://github.com/AssemblyScript/assemblyscript) benchmark testing suite that will comfortably compile your code into [**WebAssembly**](http://webassembly.org) and test its performance. It has been design to be easy to use, fast, and lightweight as possible.

### Introduction

Benchmarking and optimizations are an important step of every project. You have a responsibility to make sure that software you write works as intended and is within your acceptable standard deviation. The as-bench project was created to help you quickly scaffold and bootstrap AssemblyScript benchmark tests so that you can be confident in yourself (and brag to your team) of how efficent and fast your code is. Remember every bit code saved is also a Planck of energy saved.

The as-bench benchmark suite itself was designed to solve a few problems:

- Create a set of benchmark API that match Jest ergonomics
- Compile and bootstrap your tests from a CLI
- Standardize the way AssemblyScript modules are written
- Encourage good optimization habits

None of these problems are trivial, and as-bench provides an opinionated way to get started with optimizing your software.
If any problems exist with this documentation, you may file an [**issue**](https://github.com/jtenner/as-bench/issues/new).

### Getting Started

Download some stuff from npm, run some cli commands, and voilà you know what code is slow and fast

```sh
# initialize a node project
npm init

# install assemblyscript nightly
npm install --save-exact --save-dev assemblyscript@nightly

# get the latest version of as-pect
npm install --save-dev @as-bench/cli

# scaffold a new project
npx asinit .
npx asb --init
```

### Examples

Checkout the [`examples`](./examples) directory for a bunch of great examples of useful test cases, or hop over to our [**gitbook**](https://github.com/jtenner/as-bench) for further documentation

#### Code Structure

```ts
bench("a group", () => {
  beforeAll(() => {});
  beforeEach(() => {});
  test("a test", () => {});
  bench("a child group", () => {
    beforeAll(() => {});
    test("a test", () => {});
    afterAll(() => {});
  });
  afterEach(() => {});
  afterAll(() => {});
});
```

#### Simple Example

```ts
const theMeaningOfLife: f64 = 42.0;
const amount: u32 = 1000000;

let fortyTwo: f64;

bench("The Meaning Of Life", amount, () => {
  beforeAll(() => {
    fortyTwo = 42; //someInitialValue;
  });
  test("the square the meaning of life", () => {
    fortyTwo += theMeaningofLife * theMeaningofLife;
  });
  test("the power of the meaning of life", () => {
    fortyTwo += Math.pow(theMeaningofLife, 2.0);
  });
  afterAll(() => {
    if (fortyTwo !== 42) {
      console.log("The meaning to life is not: ", fortyTwo);
      fortyTwo = 42; //correct answer
      console.log(
        fortyTwo +
          " is the Answer to the Ultimate Question of Life, the Universe and Everything.",
      );
    }
  });
});

//### outputs
//$~ * benchmark 'The Meaning Of Life' => '1000000' times
//$~ |--> A: 'the square the meaning of life" finished in 420.31459265ms @ 1234ops/ms
//$~ |--> B: 'the power of the meaning of life' finished in 555.123456789ms @ 1111ops/ms
//$~ |--> **test A is 18% faster then B**
//$~ o -> The meaning to life is not: 4.201945656021613227630487850325243748596838e42
//$~ o -> 42 is the Answer to the Ultimate Question of Life, the Universe and Everything.
```

### Contributing

To contribute please see [CONTRIBUTING.md](./CONTRIBUTING.md).

### Special Thanks

Special thanks to the [_AssemblyScript_](https://github.com/AssemblyScript/assemblyscript) team for creating AssemblyScript itself.
