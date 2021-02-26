let runs = new StaticArray<f64>(__getDefaultIterationCount());
let runIndex: i32 = 0;

/// TODO move into static utility class
/** simple sorting algorythm */
function quicksort(numbers: StaticArray<f64>, first: i32, last: i32): void{
  let i: i32, j: i32 , pivot: i32, temp: f64;
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

/** clears current run index for next run series*/
export function __resetRunIndex(): void {
  cachedVariance = NaN;
  runIndex = 0;
}

/** make sure we run atleast this many times */
export function __ensureRunCount(count: i32): void {
  if (runs.length < count) {
    let newRuns = new StaticArray<f64>(count);
    memory.copy(changetype<usize>(newRuns), changetype<usize>(runs), runs.length << alignof<f64>());
    runs = newRuns;
  }
}

/** returns our array of executed runs */
export function __getRuns(): StaticArray<f64> {
  return runs;
}

/** calls function to benchmark by callback pointer */
export function __call(index: i32): void {
  call_indirect(index);
}

/** returns default boolean if the bench should collect mean metrics */
export function __getDefaultCalculateMean(): bool {
  return isDefined(ASBENCH_CALCULATE_MEAN)
    ? <bool>ASBENCH_CALCULATE_MEAN
    : true;
}

/** returns default boolean if the bench should collect median metrics */
export function __getDefaultCalculateMedian(): bool {
  return isDefined(ASBENCH_CALCULATE_MEDIAN)
    ? <bool>ASBENCH_CALCULATE_MEDIAN
    : true;
}

/** returns default boolean if the bench should collect maximum metrics */
export function __getDefaultCalculateMaximum(): bool {
  return isDefined(ASBENCH_CALCULATE_MAXIMUM)
    ? <bool>ASBENCH_CALCULATE_MAXIMUM
    : false;
}

/** returns default boolean if the bench should collect minimum metrics */
export function __getDefaultCalculateMinimum(): bool {
  return isDefined(ASBENCH_CALCULATE_MINIMUM)
    ? <bool>ASBENCH_CALCULATE_MINIMUM
    : false;
}

/** returns default boolean if the bench should collect variance metrics */
export function __getDefaultCalculateVariance(): bool {
  return isDefined(ASBENCH_CALCULATE_VARIANCE)
    ? <bool>ASBENCH_CALCULATE_VARIANCE
    : false;
}

/** returns default boolean if the bench should collect standard deviation metrics */
export function __getDefaultCalculateStdDev(): bool {
  return isDefined(ASBENCH_CALCULATE_STDDEV)
    ? <bool>ASBENCH_CALCULATE_STDDEV
    : false;
}

/** returns the default minimum times to iterate our bench run */
export function __getDefaultMinIterationCount(): i32 {
  return isDefined(ASBENCH_MIN_ITERATION_COUNT)
    ? <i32>ASBENCH_MIN_ITERATION_COUNT
    : 10000;
}

/** returns the default times to iterate the bench run*/
export function __getDefaultIterationCount(): i32 {
  return isDefined(ASBENCH_ITERATION_COUNT)
    ? <i32>ASBENCH_ITERATION_COUNT
    : 1000;
}

/** returns default time until the run should timeout and stop */
export function __getDefaultMaxRuntime(): i32 {
  return isDefined(ASBENCH_MAX_RUNTIME)
    ? <i32>ASBENCH_MAX_RUNTIME
    : 10000;
}

//TODO move into a static utility class
/** helper function that returns our static array from memory  */
export function __getStaticArrayI32ID(): i32 {
  return <i32>idof<StaticArray<i32>>();
}

/** 
 * execute our run by iterating over the same callback function by id. Also
 * this function will call beforeEach and afterEach functions for each
 * iteration
 */
export function __runIterations(callback: i32, beforeEach: StaticArray<i32>, afterEach: StaticArray<i32>, iterations: i32): i32 {
  // determine how much we want to thrash the cpu
  let beforeEachLength = beforeEach.length;
  let afterEachLength = afterEach.length;

  // begin thrashings
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

  // return our iterations count to the stack
  return iterations;
}

///////////////////////////////////////////////////////////
/// CALCULATION MATH FUNCTIONS
//////////////////////////////////////////////////////////

/** calculate our mean value of run and returns a 64bit float */
export function __mean(): f64 {
  if (runIndex == 0) return NaN;
  let sum: f64 = 0;
  for (let i = 0; i < runIndex; i++) {
    sum += unchecked(runs[i]);
  }
  return <f64>sum / <f64>runIndex;
}

/** calculate our median value of run and returns a 64bit float */
export function __median(): f64 {
  if (runIndex === 0) return NaN;
  const odd = bool(runIndex & 1);
  const halfLength = runIndex >>> 1;
  quicksort(runs, 0, runIndex - 1); // last run is stored at runIndex - 1
  return odd
    ? runs[halfLength + 1]
    : (runs[halfLength] + runs[halfLength + 1]) / 2;
}

/** calculate our maximum value of run and returns a 64bit float */
export function __maximum(): f64 {
  if (runIndex == 0) return NaN;
  let val: f64 = 0;
  for (let i = 0; i < runIndex; i++) {
    val = max<f64>(val, unchecked(runs[i])); // the other max
  }
  return val;
}

/** calculate our minimum value of run and returns a 64bit float */
export function __minimum(): f64 {
  if (runIndex == 0) return NaN;
  let val: f64 = unchecked(runs[0]);
  for (let i = 1; i < runIndex; i++) {
    val = min<f64>(val, unchecked(runs[i]));
  }
  return val;
}

/// TODO make sure we clear on reset
/** propert to store our cached variance values to be used by other calcs*/
let cachedVariance: f64 = NaN;

/** calculates our average variance of the run */
export function __variance(): f64 {
  if (runIndex == 0) return NaN;
  if (!isNaN(cachedVariance)) return cachedVariance;
  let avg = __mean(),
      i = runIndex,
      val: f64 = 0;
  while (i--) {
    val += (unchecked(runs[i]) - avg) ** 2;
  }
  val /= <f64>runIndex;
  return (cachedVariance = val);
}

///TODO is this the correct standard deviation algo?
/** calculate our standard deviation. */
export function __stdDev(): f64 {
  return sqrt(__variance());
}

///TODO move into static utility class
/** helper function used to create skeleton arrays to buffer */
export function __newI32Array(length: u32): StaticArray<i32> {
  return new StaticArray<i32>(length);
}

///////////////////////////////////////////////////////////
/// AS-BENCH IMPORTS 
///////////////////////////////////////////////////////////

// @ts-ignore: valid decorator
@external("__asbench", "setCalculateMean") @global
declare function mean(enable: bool): void;

// @ts-ignore: valid decorator
@external("__asbench", "setCalculateMedian") @global
declare function median(enable: bool): void;

// @ts-ignore: valid decorator
@external("__asbench", "setCalculateMaximum") @global
declare function maximum(enable: bool): void;

// @ts-ignore: valid decorator
@external("__asbench", "setCalculateMinimum") @global
declare function minimum(enable: bool): void;

// @ts-ignore: valid decorator
@external("__asbench", "setCalculateVariance") @global
declare function variance(enable: bool): void;

// @ts-ignore: valid decorator
@external("__asbench", "setCalculateStdDev") @global
declare function stdDev(enable: bool): void;

///////////////////////////////////////////////////////////
/// NATIVE IMPORTS
///////////////////////////////////////////////////////////

// @ts-ignore valid decorator
@external("performance", "now")
declare function now(): f64;