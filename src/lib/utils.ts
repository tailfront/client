import path from 'path';
import fs from 'fs-extra';
import {type PackageJson} from 'type-fest';
import chalk from 'chalk';

const info = (): PackageJson => {
  const packageJson = path.join(__dirname, '../../package.json');
  return fs.readJSONSync(packageJson) as PackageJson;
};
const PKG = info();

const status = {
  failed:  '[' + chalk.red.bold('FAILED') + ']',
  warn:    '[ ' + chalk.yellow.bold('WARN') + ' ]',
  info:    '[ ' + chalk.cyan.bold('INFO') + ' ]',
  ok:      '[  ' + chalk.green.bold('OK') + '  ]',
  unknown: '[ ' + chalk.gray.bold('UNK.') + ' ]',
}
const _log = (message: string, print: boolean = true) => {
  if (print) console.log(message);
}
const logcase = (status: string) => {
  return (message: string, print: boolean = true): void => {
    _log(`${status} ${message}`, print);
  };
};
const log = {
  failed: logcase(status.failed),
  warn: logcase(status.warn),
  info: logcase(status.info),
  ok: logcase(status.ok),
  break: (): void => console.log(''),
  tf: (): void => {
    let name, email, url;
    if (typeof PKG.author === 'object' && PKG.author !== null) {
      name = 'name' in PKG.author && PKG.author.name !== undefined
        ? PKG.author.name
        : 'Tailfront';
      email = 'email' in PKG.author && PKG.author.email !== undefined
        ? PKG.author.email
        : 'info@pixsellz.io';
      url = 'url' in PKG.author && PKG.author.url !== undefined
        ? PKG.author.url
        : 'https://pixsellz.io';
    }
    console.log(chalk.bgBlack.white('    '), '         ', email);
    console.log(chalk.bgBlack.white('  tf'), name, url);
    log.break();
  }
};
const err = (error: unknown): void => {
  if (typeof error === 'string') {
    log.failed(error);
    process.exit(1);
  }
  if (error instanceof Error) {
    log.failed(error.message);
    process.exit(1);
  }
  log.failed('Unknown error. Please report it.');
  process.exit(1);
};

export {PKG, log, err};
