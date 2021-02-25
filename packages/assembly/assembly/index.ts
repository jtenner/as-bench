
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
