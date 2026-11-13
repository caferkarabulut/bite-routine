import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const script = resolve(__dirname, "../scripts/sync-catalog.mjs");

function run(args: string[]) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

describe("sync-catalog script", () => {
  let dir: string;
  let src: string;
  let dest: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "catalog-sync-"));
    src = join(dir, "src.json");
    dest = join(dir, "nested", "dest.json");
    writeFileSync(src, '{"version":1,"items":[]}\n');
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("copies byte-identically and then passes --check", () => {
    expect(run(["--src", src, "--dest", dest]).status).toBe(0);
    expect(readFileSync(dest).equals(readFileSync(src))).toBe(true);
    expect(run(["--check", "--src", src, "--dest", dest]).status).toBe(0);
  });

  it("--check fails with a clear message when files differ or dest is missing", () => {
    const missing = run(["--check", "--src", src, "--dest", dest]);
    expect(missing.status).toBe(1);
    run(["--src", src, "--dest", dest]);
    writeFileSync(src, '{"version":2,"items":[]}\n');
    const differ = run(["--check", "--src", src, "--dest", dest]);
    expect(differ.status).toBe(1);
    expect(differ.stderr).toContain("out of date");
  });

  it("fails when the source is missing", () => {
    expect(run(["--src", join(dir, "nope.json"), "--dest", dest]).status).toBe(1);
  });

  it("bundled catalog is in sync with catalog/dist", () => {
    expect(run(["--check"]).status).toBe(0);
  });
});
