@external("performance", "now")
declare function now(): f64;

let runs = new StaticArray<f64>(__getDefaultIterationCount());
let runIndex: i32 = 0;

export function __ensureRunCount(count: i32): void {
  if (runs.length < count) {
    let newRuns = new StaticArray<f64>(count);
    memory.copy(changetype<usize>(newRuns), changetype<usize>(runs), runs.length << alignof<f64>());
    runs = newRuns;
  }
}

export function __getRuns(): StaticArray<f64> {
  return runs;
}

export function __call(index: i32): void {
  call_indirect(index);
}

export function __getDefaultCalculateMean(): bool {
  return isDefined(ASBENCH_CALCULATE_MEAN)
    ? <bool>ASBENCH_CALCULATE_MEAN
    : true;
}

export function __getDefaultCalculateMedian(): bool {
  return isDefined(ASBENCH_CALCULATE_MEDIAN)
    ? <bool>ASBENCH_CALCULATE_MEDIAN
    : true;
}

export function __getDefaultCalculateMax(): bool {
  return isDefined(ASBENCH_CALCULATE_MAX)
    ? <bool>ASBENCH_CALCULATE_MAX
    : false;
}

export function __getDefaultCalculateMin(): bool {
  return isDefined(ASBENCH_CALCULATE_MIN)
    ? <bool>ASBENCH_CALCULATE_MIN
    : false;
}

export function __getDefaultCalculateVariance(): bool {
  return isDefined(ASBENCH_CALCULATE_VARIANCE)
    ? <bool>ASBENCH_CALCULATE_VARIANCE
    : false;
}

export function __getDefaultCalculateStdDev(): bool {
  return isDefined(ASBENCH_CALCULATE_STDDEV)
    ? <bool>ASBENCH_CALCULATE_STDDEV
    : false;
}

export function __getDefaultMinIterationCount(): i32 {
  return isDefined(ASBENCH_MIN_ITERATION_COUNT)
    ? <i32>ASBENCH_MIN_ITERATION_COUNT
    : 10000;
}

export function __getDefaultIterationCount(): i32 {
  return isDefined(ASBENCH_ITERATION_COUNT)
    ? <i32>ASBENCH_ITERATION_COUNT
    : 1000;
}

export function __getDefaultMaxRuntime(): i32 {
  return isDefined(ASBENCH_MAX_RUNTIME)
    ? <i32>ASBENCH_MAX_RUNTIME
    : 10000;
}

export function __getStaticArrayI32ID(): i32 {
  return <i32>idof<StaticArray<i32>>();
}

export function __runIterations(callback: i32, beforeEach: StaticArray<i32>, afterEach: StaticArray<i32>, iterations: i32): i32 {
  let beforeEachLength = beforeEach.length;
  let afterEachLength = afterEach.length;

  for (let j = 0; j < iterations; j++) {
    // run every beforeEach callback
    for (let i = 0; i < beforeEachLength; i++) call_indirect(unchecked(beforeEach[i]));

    // start the timer and run the callback indirectly
    let start = now();
    call_indirect(callback);

    // end the timer
    runs[runIndex++] = now() - start;

    // call every afterEach callback
    for (let i = 0; i < afterEachLength; i++) call_indirect(unchecked(afterEach[i]));
  }

  return iterations; // push the iterations count to the stack
}
