import { existsSync, rmSync } from "node:fs";
import { resolve, sep } from "node:path";

// SAT content remains in public/ for repair, but must not ship while unverified.
const outputDirectory = resolve(process.cwd(), "dist");
const satDirectories = ["sat_images", "tests/sat", "tests/standard/sat"];

for (const relativePath of satDirectories) {
  const target = resolve(outputDirectory, relativePath);
  if (!target.startsWith(`${outputDirectory}${sep}`)) {
    throw new Error(`Refusing to remove a path outside dist: ${target}`);
  }
  if (existsSync(target)) {
    rmSync(target, { recursive: true });
    console.log(`Excluded SAT build assets: ${relativePath}`);
  }
}
