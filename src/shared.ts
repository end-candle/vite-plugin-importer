import fs from 'fs';

export function fileExists(f: string) {
  try {
    fs.accessSync(f, fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export function isFunction(value: any): value is (...args: any[]) => any {
  return value && Object.prototype.toString.call(value) === '[object Function]';
}
