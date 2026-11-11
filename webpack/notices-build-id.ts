// Copied from paranext-core's `.erb/scripts/notices-build-id.ts`, with `REPO` changed for this
// folder layout. Keep the two in step: paranext-core's third-party notices generator reads the
// stamp this writes.

/**
 * Stamps one identity on every module manifest a single build produces.
 *
 * The web-view and main webpack configurations each write a module manifest
 * (`.notices/modules/*.json`), and paranext-core's notices generator unions them into one list of
 * bundled packages. Without a shared stamp, manifests from two different builds are
 * indistinguishable, and a stale manifest silently shortens that list.
 *
 * Run as both `prebuild` and `prebuild:production`. npm runs a `pre` script only for the script of
 * the same name, and `npm run package` calls `build:production`, so a `prebuild` alone would never
 * run before a packaged build. When this file is absent the plugin stamps each manifest with its
 * own `unstamped-` value, the manifests disagree, and the generator refuses them.
 *
 * What this does NOT catch: the file persists between builds, so building one configuration on its
 * own afterwards (`npm run build:main`) re-stamps its manifest with the same id. Package with `npm
 * run package`, which runs this first.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const REPO = path.resolve(__dirname, '..');

/** Name of the stamp file, spelled once so the writer and the reader cannot drift apart. */
const BUILD_ID = 'build-id';

const FILE = path.join(REPO, '.notices', BUILD_ID);

/**
 * Where the stamp file sits relative to the module manifests.
 *
 * The webpack plugin that stamps each manifest (`emit-shipped-modules-plugin.ts`) and
 * paranext-core's generator that checks the stamps agree both know only the manifest directory, and
 * reach the stamp from it.
 *
 * @param manifestDir Directory the module manifests are written to.
 */
export function buildIdFile(manifestDir: string): string {
  return path.join(manifestDir, '..', BUILD_ID);
}

export function main(): void {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}`;
  fs.writeFileSync(FILE, `${id}\n`);
  console.log(`notices build id: ${id}`);
}

if (require.main === module) main();
