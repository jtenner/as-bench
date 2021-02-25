/**
 * This function calls a specific function within our web assembly
 * instance to perform a benchmark on.
 * 
 * @param index - The function pointer index in our wasm export table.
 * 
 * @example
 * ```ts
 * exports.call(42)
 * ```
 */
declare function call(index: number): void

/**
 * This function is used to get the calculate default mean value amount
 * for the given bench.
 */
declare function getDefaultCalculateMean(): boolean

/**
 * This function calculates the median value of the given bench.
 */
declare function getDefaultCalculateMedian(): boolean

/**
 * This function calculates the maxoum value of the given bench.
 */
declare function getDefaultCalculateMax(): boolean

/**
 * This function calculates the minimum value of the given bench.
 */
declare function getDefaultCalculateMin(): boolean

/**
 * This function calculates the difference between test in our bench.
 */
declare function getDefaultCalculateVariance(): boolean

/**
 * This function calculates the standard deviation of the benchmark.
 */
declare function getDefaultCalculateStdDev(): boolean

/**
 * This function returns how many times test were run in the bench.
 */
declare function getDefaultIterationCount(): number

/**
 * This function returns the maximum time that the bench will until self abort.
 */
declare function getDefaultMaxRuntime(): number