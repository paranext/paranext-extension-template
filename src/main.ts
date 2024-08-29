// @ts-ignore: TS2307 - Cannot find module '@papi/backend' or its corresponding type declarations
import { logger } from '@papi/backend';

export async function activate() {
  logger.info('Extension template is activating!');
}

export async function deactivate() {
  logger.info('Extension template is deactivating!');
  return true;
}
