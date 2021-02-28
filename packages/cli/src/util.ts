import chalk from "chalk";

/**
 * @ignore
 *
 * This method prints the awesome ascii art title.
 * @param {string} version - The cli version
 */
export function printTitle(version: string): void {
  let title: string = 
    `       ____   _____         ____  _______   __________  __   \n` +
    `     //    |// ___/       // __ )/ ____/ | / / ____/ / / /   \n` +
    `    // //| |\\\\__ \\\\______// __  / __/ /  |/ / /   / /_/ /    \n` +
    `   // ___  |___// /_____// _// / /___/ /|  / /___/ __  /     \n` +
    `  //_/___|_|____ /     //_____/_____/_/ |_/\\\\___/_/ /_/      \n` +
    `                                                             \n`
    
  let desc = `🧪AS-Bench🧪 awesome web assembly script benchmarks [v${version}]`
  console.log(chalk.bold.bgWhite.black(title))
  console.log(chalk.bold.italic(desc))
}