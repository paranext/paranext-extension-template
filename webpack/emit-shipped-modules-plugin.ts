// #region shared with https://github.com/paranext/paranext-multi-extension-template/blob/main/webpack/emit-shipped-modules-plugin.ts

// The code matches paranext-core's `.erb/configs/emit-shipped-modules-plugin.ts` apart from the
// import path. Keep the two in step: paranext-core's third-party notices generator reads the
// manifests this writes. The comments here describe this repository's build; that file's comments
// give the full design rationale.

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import webpack from 'webpack';
import { buildIdFile } from './notices-build-id';

const NAME = 'EmitShippedModulesPlugin';

/**
 * The identity of the build this manifest belongs to, written by `./notices-build-id.ts` (run as
 * `prebuild` and `prebuild:production`) before webpack starts.
 *
 * The notices generator unions the `extension-main` and `extension-web-view` manifests, so it has
 * to know they come from the same build: a stale manifest would silently leave packages out. It
 * refuses a set whose ids disagree. With no id file, each manifest gets its own `unstamped-` value,
 * which matches nothing, so the set is refused rather than trusted.
 */
function buildId(outputDir: string): string {
  try {
    return fs.readFileSync(buildIdFile(outputDir), 'utf8').trim();
  } catch {
    return `unstamped-${crypto.randomUUID()}`;
  }
}

/**
 * Whether this compiler's persistent filesystem cache directory already held content before this
 * run started.
 *
 * A module webpack restores from a warm cache does not re-run its loaders, so modules a loader adds
 * while it runs (`css-loader`'s runtime helpers, for example) never reach `finishModules`, and the
 * manifest under-reports what the bundle contains. The notices generator refuses a manifest stamped
 * `cacheWarm`.
 *
 * This repository's webpack configuration sets no `cache`, so this returns `false` here. It stays
 * so that an extension that adds `cache: { type: 'filesystem' }` has a warm build refused rather
 * than trusted.
 */
export function isWarmFilesystemCache(cache: webpack.Configuration['cache']): boolean {
  if (!cache || typeof cache !== 'object' || cache.type !== 'filesystem') return false;
  // webpack's own default when a filesystem cache names no directory. Answering cold here would
  // trust a manifest built over a directory that is warm on any tree built twice.
  const dir = cache.cacheDirectory || path.join(process.cwd(), 'node_modules', '.cache', 'webpack');
  try {
    return fs.readdirSync(dir).length > 0;
  } catch (error: unknown) {
    // The directory was never created, so nothing can have been served from it.
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    // Any other failure (`EACCES`, `EMFILE`) leaves the answer unknown. Answering warm fails closed:
    // the generator refuses the manifest, while a build that isn't producing notices still
    // succeeds. Throwing would fail that build, or end an `npm run watch` session.
    console.warn(
      `[${NAME}] could not read the webpack cache directory ${dir} to decide whether this build ` +
        `was served from a warm cache (${error instanceof Error ? error.message : String(error)}). ` +
        'Recording the build as warm, which refuses to certify its manifest for the notices ' +
        'generator.',
    );
    return true;
  }
}

/**
 * Writes the list of modules webpack compiled into a bundle to `<outputDir>/<bundleName>.json`.
 *
 * Bundling erases package boundaries, so neither `package.json` (bundled packages are
 * `devDependencies`) nor a scan of the output can say which npm packages ship. The compiler knows.
 *
 * Hooks `finishModules` rather than reading `compilation.modules` at emit time: by then module
 * concatenation has merged modules into wrappers whose contents are not directly enumerable.
 *
 * Also stamps the build id (see `buildId`), the webpack mode and `cacheWarm` (see
 * `isWarmFilesystemCache`), which the generator checks before trusting the list.
 */
export class EmitShippedModulesPlugin {
  constructor(private options: { bundleName: string; outputDir: string }) {}

  apply(compiler: webpack.Compiler) {
    const resources = new Set<string>();
    let cacheWarm = false;

    // `beforeRun` fires for a one-shot build and `watchRun` for every rebuild under `npm run watch`
    // or `npm start`. Both reset the list, so a module deleted from the source leaves the manifest
    // on the next rebuild.
    const startRun = () => {
      resources.clear();
      cacheWarm = isWarmFilesystemCache(compiler.options.cache);
    };
    compiler.hooks.beforeRun.tap(NAME, startRun);
    compiler.hooks.watchRun.tap(NAME, startRun);

    // The parent compilation only: webpack does not copy `thisCompilation` taps to child compilers.
    // This repository's builds create none. The first `new Worker(new URL(...))` would add one whose
    // output ships, and it would need tapping too; paranext-core's copy explains how to tell that
    // kind from a child compiler whose output is thrown away.
    compiler.hooks.thisCompilation.tap(NAME, (compilation) => {
      compilation.hooks.finishModules.tap(NAME, (modules) => {
        // webpack declares `modules` as `Iterable<Module>`, which has no `.forEach`.
        Array.from(modules).forEach((module) => {
          // Some module kinds (loaders, virtual modules) have no `resource`. A query string
          // (`?inline`, `?raw`) names the same file for licensing purposes.
          const resource =
            'resource' in module && typeof module.resource === 'string'
              ? module.resource
              : undefined;
          if (resource) resources.add(resource.split('?')[0]);
        });
      });
    });

    compiler.hooks.done.tap(NAME, (stats) => {
      // `done` fires for a failed compilation too, with whatever part of the graph webpack reached.
      // Writing that would record a partial list under the current build id, which the generator
      // could not tell from a complete one. The previous manifest is left in place instead; its
      // earlier build id makes the generator refuse the set.
      if (stats.hasErrors()) {
        console.log(
          `${NAME}: compilation failed, so no manifest was written for ${this.options.bundleName}`,
        );
        return;
      }
      const { bundleName, outputDir } = this.options;
      fs.mkdirSync(outputDir, { recursive: true });
      const out = path.join(outputDir, `${bundleName}.json`);
      const build = buildId(outputDir);
      // Written to a temporary file and renamed: the generator reads this from another process, and
      // a half-written file would fail there with a bare `SyntaxError` that names no file.
      const tmp = `${out}.tmp`;
      const contents = `${JSON.stringify(
        {
          bundle: bundleName,
          buildId: build,
          // The generator trusts only production manifests, which `npm run package` writes.
          // `npm run build` writes development ones.
          mode: compiler.options.mode || 'none',
          cacheWarm,
          modules: [...resources].sort(),
        },
        undefined,
        2,
      )}\n`;
      // A watch rebuild that ships the same modules leaves the file untouched.
      let existing;
      try {
        existing = fs.readFileSync(out, 'utf8');
      } catch {
        existing = undefined;
      }
      if (existing === contents) return;
      fs.writeFileSync(tmp, contents);
      fs.renameSync(tmp, out);
      console.log(
        `${NAME}: wrote ${resources.size} module paths to ${out} (build ${build}${cacheWarm ? ', warm cache' : ''})`,
      );
    });
  }
}

// #endregion
