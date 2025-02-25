import {Command} from 'commander';
import {err, log, Pkg, manifestf} from './../lib/utils';
import {z} from 'zod';
import path from 'path';
import fs from 'fs';
import prompts from 'prompts';
import chalk from 'chalk';

const schema = z.object({
  components: z.array(z.string()).optional(),
  overwrite: z.boolean(),
  deps: z.boolean(),
  path: z.string().optional(),
  verbose: z.boolean(),
  cwd: z.string(),
});

const REGISTRY = 'https://raw.githubusercontent.com/tailfront/elements/main/src/components/';
const parse = Pkg.parse();
const root = Pkg.root(parse);

const command = new Command()
  .name('elements')
  .description('The foundational GUI elements that shape the enchanting world of Tailfront.')
  .argument('[components...]', 'Components to add')
  .option('-o, --overwrite', 'Overwrite existing files', false)
  .option('-d, --deps', 'Automatically install dependencies', false)
  .option(
    '-c, --cwd <cwd>',
    'Set working directory',
    root,
  )
  .option('-p, --path <path>', 'Set path to add components', `src/components`)
  .action(async (components, opts) => {
    try {
      const options = schema.parse({
        components,
        ...opts,
        verbose: command.parent?.opts().verbose,
      });
      log.ok('Command options are parsed.', options.verbose);
      const cwd = path.resolve(options.cwd);
      if (!fs.existsSync(cwd))
        err(`The path ${cwd} does not exist. Please try again.`);
      log.ok('Current working directory is resolved.', options.verbose);
      const dir = path.join(cwd, options.path || '');
      if (!fs.existsSync(dir))
        await fs.mkdir(dir, {recursive: true}, () => {});
      log.ok('Components path is resolved.');
      if (!options.components?.length)
        log.warn('No components are listed.');
      for (const component of options.components || []) {
        const name = component + '.tsx';
        log.ok(`Start downloading component: ${component}`, options.verbose);
        const save = path.join(dir, name);
        if (fs.existsSync(save)) {
          log.ok(`Overwrite option check: ${component}`);
          if (!options.overwrite) {
            const {overwrite} = await prompts({
              type: 'confirm',
              name: 'overwrite',
              message: `${name} already exists. Do you want to overwrite?`,
              initial: false,
            });
            if (!overwrite) {
              log.info(
                `Skipped ${component}. To overwrite, run with the ${chalk.green(
                  '--overwrite'
                )} flag.`
              );
              continue;
            }
          }
        }
        let content: string = '';
        try {
          const registryPath = path.join(REGISTRY, name);
          log.ok(`Fetch registry for component: ${registryPath}`, options.verbose);
          const response = await fetch(registryPath);
          switch (response.status) {
            case 200:
              log.ok(`Successfully downloaded: ${component}`, options.verbose);
              break;
            case 404:
              log.failed(`Component not found: ${component}`);
              continue;

            default:
              throw new Error(`Unable to download a component (${response.status}): ${component}`);
          }
          content = await response.text();
        } catch (error) {
          err(error);
        }
        if (!content) {
          log.warn(`Skipped empty component: ${component}`);
          continue;
        }
        log.ok(`Start preparing manifest: ${component}`, options.verbose);
        let jsdoc = content.match(/\/\*\*[\s\S]*?\*\//);
        let manifest = '';
        if (jsdoc)
          manifest = jsdoc[0];
        fs.writeFileSync(save, content);
        if (!manifest) {
          log.info(`Empty manifest: ${component}`);
        } else {
          if (!options.deps) {
            const {deps} = await prompts({
              type: 'confirm',
              name: 'deps',
              message: 'Install dependencies automatically?',
              initial: false,
            });
            if (!deps) {
              log.info(`Automatic dependency install is skipped.\nPlease install ${chalk.blue('@npm')} packages.`);
            } else {
              Pkg.install(
                Pkg.extract(/@npm\s+([^\r\n]*)/g, manifest),
                Pkg.list(parse)
              );
            }
          }
          log.ok(`${component} is added, printing manifest`);
          manifestf(manifest);
        }
      }
    } catch (error) {
      err(error);
    }
  });

export {command};
