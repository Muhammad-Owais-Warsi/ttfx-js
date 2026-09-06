#!/usr/bin/env node
// ttfx launcher: pick the prebuilt binary for this OS/CPU and hand it the
// terminal (stdio: inherit), so colors, animation, Ctrl-C and exit codes
// behave exactly like the native binary. Zero dependencies.
"use strict";

const { spawnSync } = require("node:child_process");
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function isMusl() {
  try {
    const out = execSync("ldd --version", { stdio: ["ignore", "pipe", "pipe"] }).toString();
    return out.includes("musl");
  } catch {
    try {
      return fs.readFileSync("/usr/bin/ldd", "utf8").includes("musl");
    } catch {
      return false;
    }
  }
}

function platformPackage() {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === "win32" && arch === "x64") return "ttfx-windows-x64";
  if (platform === "darwin" && arch === "x64") return "ttfx-darwin-x64";
  if (platform === "darwin" && arch === "arm64") return "ttfx-darwin-arm64";
  if (platform === "linux" && arch === "x64") {
    return isMusl() ? "ttfx-linux-x64-musl" : "ttfx-linux-x64-gnu";
  }
  return null;
}

function main() {
  const pkg = platformPackage();
  if (!pkg) {
    console.error(
      `ttfx: unsupported platform ${process.platform}/${process.arch}. See https://github.com/Muhammad-Owais-Warsi/ttfx-js/releases`
    );
    process.exit(1);
  }
  const exe = process.platform === "win32" ? "ttfx.exe" : "ttfx";
  const bin = path.join(__dirname, "..", "..", pkg, exe);
  if (!fs.existsSync(bin)) {
    console.error(
      `ttfx: binary missing for ${process.platform}/${process.arch} (looked for ${pkg}). ` +
        `Reinstall with: npm i -f ttfx`
    );
    process.exit(1);
  }
  const result = spawnSync(bin, process.argv.slice(2), { stdio: "inherit" });
  if (result.error) {
    console.error(`ttfx: failed to run ${bin}: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status == null ? 1 : result.status);
}

main();
