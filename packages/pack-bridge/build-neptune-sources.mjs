#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(here, "../../..");

const builds = [
  {
    name: "RAGE client",
    directory: "src_client",
    cli: "node_modules/webpack-cli/bin/cli.js",
    arguments: ["--config", "webpack.config.js", "--mode=production"],
  },
  {
    name: "Svelte CEF",
    directory: "src_cef",
    cli: "node_modules/webpack-cli/bin/cli.js",
    arguments: ["--config", "webpack.config.js", "--mode=production", "--no-cache"],
  },
  {
    name: "Svelte CEF buildru",
    directory: "src_cef",
    cli: "node_modules/webpack-cli/bin/cli.js",
    arguments: ["--config", "webpackru.config.js", "--mode=production", "--no-cache"],
  },
  {
    name: "Vue CEF",
    directory: "src_cef_new",
    cli: "node_modules/vite/bin/vite.js",
    arguments: ["build"],
  },
];

for (const build of builds) {
  const workingDirectory = resolve(sourceRoot, build.directory);
  const cli = resolve(workingDirectory, build.cli);
  if (!existsSync(cli)) {
    throw new Error(`${build.name}: missing ${cli}; install this source package first`);
  }

  process.stdout.write(`[neptune-sources] Building ${build.name}\n`);
  const result = spawnSync(process.execPath, [cli, ...build.arguments], {
    cwd: workingDirectory,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${build.name}: build exited with ${result.status ?? result.signal}`);
  }
}

process.stdout.write("[neptune-sources] Client and CEF bundles are current\n");
