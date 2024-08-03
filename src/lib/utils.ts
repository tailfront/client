import path from 'path';
import fs from 'fs-extra';
import {type PackageJson} from 'type-fest';
import chalk from 'chalk';
import {execSync} from 'child_process';

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

namespace Pkg {
  export function root(lines: string[]): string {
    return lines[0];
  }
  export function list(parse: string[]): string[] {
    return parse.slice(1).map(line => {
      const parts = line.split('node_modules/');
      return parts[parts.length - 1];
    });
  }
  export function parse(): string[] {
    const ls = 'npm ls -p';
    let raw: string = '';
    try {
      raw = execSync(ls).toString();
    } catch (err) {}
    return raw.trim().split('\n');
  }
  export function extract(regex: RegExp, src: string): string[] {
    const pkgs: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(src)) !== null) {
      pkgs.push(match[1]);
    }
    return pkgs;
  }
  export function install(pkgs: string[], skip: string[]): void {
    const miss = pkgs.filter(pkg => !skip.includes(pkg));
    if (miss.length > 0) {
      log.info(`Installing missing packages: ${miss}`);
      for (const pkg of miss) {
        try {
          execSync(`npm ${pkg} > /dev/null`, {stdio: 'inherit'});
          log.ok(`Package installed: ${pkg}`);
        } catch (error) {
          log.failed(`Error installing package ${pkg}: ${error}`);
        }
      }
    }
    log.ok('Required packages are installed.');
  }
}

const manifestf = (raw: string): void => {
  if (raw) {
    const format = raw
      .replace(/\/\*|\*\//g, '')
      .replace(/\*/g, '')
      .replace(/(@\w+)/g, '\x1b[34m$1\x1b[0m')
      .trim();
    log.break();
    console.log(`  ${format}`); // spaces are needed
    log.break();
  }
}

export {PKG, log, err, Pkg, manifestf};
