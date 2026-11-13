// Copies ../catalog/dist/catalog.json to assets/catalog.json (byte-identical).
// Usage: node scripts/sync-catalog.mjs [--check] [--src <file>] [--dest <file>]
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const check = args.includes("--check");

function option(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? resolve(args[i + 1]) : fallback;
}

const src = option("--src", resolve(root, "../catalog/dist/catalog.json"));
const dest = option("--dest", resolve(root, "assets/catalog.json"));

if (!existsSync(src)) {
  console.error(`Catalog source not found: ${src}\nBuild it first (see catalog/README.md).`);
  process.exit(1);
}

const srcBytes = readFileSync(src);

if (check) {
  if (!existsSync(dest) || !srcBytes.equals(readFileSync(dest))) {
    console.error(
      "mobile/assets/catalog.json is out of date with catalog/dist/catalog.json.\n" +
        "Run `node scripts/sync-catalog.mjs` in mobile/ and commit the result.",
    );
    process.exit(1);
  }
  console.log("assets/catalog.json is in sync.");
} else {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`Copied catalog (${srcBytes.length} bytes) to ${dest}`);
}
