@external("performance", "now")
declare function now(): f64;

let runs = new StaticArray<f64>(__getDefaultIterationCount());
let runIndex: i32 = 0;

function quicksort(numbers: StaticArray<f64>, first: i32, last: i32){
  let i: i32, j: i32 , pivot: i32, temp: i32;
  if (first < last){
    pivot = first;
    i = first;
    j = last;
    while (i < j){
      while (unchecked(numbers[i]) <= unchecked(numbers[pivot]) && i < last) i++;
      while (unchecked(numbers[j]) > unchecked(numbers[pivot])) j--;
      if (i < j) {
        temp = unchecked(numbers[i]);
        unchecked(numbers[i] = unchecked(numbers[j]));
        unchecked(numbers[j] = temp);
      }
    }
    temp = unchecked(numbers[pivot]);
    unchecked(numbers[pivot] = unchecked(numbers[j]));
    unchecked(numbers[j] = temp);
    quicksort(numbers, first, j - 1);
    quicksort(numbers, j + 1, last);
  }
}

export function __resetRunIndex(): void {
  runIndex = 0;
}

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
    unchecked(runs[runIndex++] = now() - start);

    // call every afterEach callback
    for (let i = 0; i < afterEachLength; i++) call_indirect(unchecked(afterEach[i]));
  }

  return iterations; // push the iterations count to the stack
}

export function __mean(): f64 {
  if (runIndex == 0) return NaN;
  let sum = 0;
  for (let i = 0; i < runIndex; i++) {
    sum += unchecked(runs[i]);
  }
  return <f64>sum / <f64>runIndex;
}

export function __median(): f64 {
  if (runIndex === 0) return NaN;
  const odd = bool(runIndex & 1);
  const halfLength = runIndex >>> 1;
  quicksort(runs, 0, runIndex - 1); // last run is stored at runIndex - 1
  return odd
    ? runs[halfLength + 1]
    : (runs[halfLength] + runs[halfLength + 1]) / 2;
}

export function __max(): f64 {
  if (runIndex == 0) return NaN;
  let maxValue: f64 = 0;
  for (let i = 0; i < runIndex; i++) {
    maxValue = max<f64>(maxValue, unchecked(runs[i]));
  }
  return maxValue;
}

export function __min(): f64 {
  if (runIndex == 0) return NaN;
  let minValue: f64 = unchecked(runs[0]);
  for (let i = 1; i < runIndex; i++) {
    minValue = min<f64>(minValue, unchecked(runs[i]));
  }
  return minValue;
}

let cachedVariance: f64 = NaN;

export function __variance(): f64 {
  if (runIndex == 0) return NaN;
  if (!isNaN(cachedVariance)) return cachedVariance;
  let avg = __mean();
  let i = runIndex,
      v: f64 = 0;

  while (i--) {
    v += (unchecked(runs[i]) - avg) ** 2;
  }
  v /= <f64>runIndex;

  return (cachedVariance = v);
}

export function __stdDev(): f64 {
  return sqrt(__variance());
}
