import { glob } from "glob";
import c from "ansi-colors";

export function globp(pattern: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, (err, matches) => {
      if (err) reject(err);
      else resolve(matches);
    });
  });
}

export function assert(condition: boolean, message: string): void {
  if (!condition) {
    process.stderr.write(c.red(`[Error] ${message}\r\n`));
    process.exit(1);
  }
}
