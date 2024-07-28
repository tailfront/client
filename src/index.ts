#!/usr/bin/env node
import {command as elements} from './commands/elements';
import {command as themes} from './commands/themes';
import {Command} from 'commander';
import {PKG, log} from './lib/utils';

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

async function main() {
  const program = new Command()
    .name('tailfront')
    .description('CLI client for distribution of Tailfront products.')
    .version(
      PKG.version || 'Unable to determine.',
      '-v, --version',
      'Display the client version'
    )
    .option('-V, --verbose', 'Enable verbose output', false);
  program
    .addCommand(elements)
    .addCommand(themes);
  log.tf();
  program.parse();
}

main();
