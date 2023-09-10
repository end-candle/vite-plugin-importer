import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { normalizePath } from 'vite';

export function fileExists(file: string) {
  try {
    return fs.statSync(file).isFile();
  } catch (e) {
    console.error(e);
    return false;
  }
}

export function isFunction(value: any): value is (...args: any[]) => any {
  return value && Object.prototype.toString.call(value) === '[object Function]';
}

export function resolveNodeModules(libName: string) {
  const esRequire = createRequire(process.cwd() + path.sep + 'node_modules');
  let modulePath = '';
  try {
    modulePath = normalizePath(esRequire.resolve(libName));
  } catch (error) {
    console.error(`${libName} not found`);
  }
  return modulePath;
}
