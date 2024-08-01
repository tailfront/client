import {Command} from 'commander';
import {err, log, Pkg, manifestf} from './../lib/utils';
import {z} from 'zod';
import path from 'path';
import fs from 'fs';
import prompts from 'prompts';
import chalk from 'chalk';

const schema = z.object({
  themes: z.array(z.string()).optional(),
  overwrite: z.boolean(),
  path: z.string().optional(),
  verbose: z.boolean(),
  cwd: z.string(),
});

const REGISTRY = 'https://raw.githubusercontent.com/tailfront/themes/main/src/';
const parse = Pkg.parse();
const root = Pkg.root(parse);

const command = new Command()
  .name('themes')
  .description('Stunning, free themes to elevate your Tailfront experience.')
  .argument('[themes...]', 'Themes to add')
  .option('-o, --overwrite', 'Overwrite existing files', false)
  .option(
    '-c, --cwd <cwd>',
    'Set working directory',
    root,
  )
  .option('-p, --path <path>', 'Set path to add themes', `config/themes`)
  .action(async (themes, opts) => {
    try {
      const options = schema.parse({
        themes,
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
      log.ok('Themes path is resolved.');
      if (!options.themes?.length)
          log.warn('No themes are listed.');
      for (const theme of options.themes || []) {
        log.ok(`Start downloading theme: ${theme}`, options.verbose);
        for (const name of ['preset.js', 'lib.js']) {
          const themeDir = path.join(dir, theme);
          const save = path.join(themeDir, name);
          if (fs.existsSync(save)) {
            log.ok(`Overwrite option check: ${theme}`, options.verbose);
            if (!options.overwrite) {
              const {overwrite} = await prompts({
                type: 'confirm',
                name: 'overwrite',
                message: `${theme}/${name} already exists. Do you want to overwrite?`,
                initial: false,
              });
              if (!overwrite) {
                log.info(
                  `Skipped ${theme}/${name}. To overwrite, run with the ${chalk.green(
                    '--overwrite'
                  )} flag.`
                );
                continue;
              }
            }
          }
          let content: string = '';
          try {
            const registryPath = path.join(REGISTRY, theme, name);
            log.ok(`Fetch registry for theme essential: ${registryPath}`, options.verbose);
            const response = await fetch(registryPath);
            switch (response.status) {
              case 200:
                if (!fs.existsSync(themeDir))
                  await fs.mkdir(themeDir, {recursive: true}, () => {});
                log.ok(`Successfully downloaded: ${theme}/${name}`, options.verbose);
                break;
              case 404:
                log.failed(`Theme essential not found: ${theme}/${name}`);
                continue;
  
              default:
                throw new Error(`Unable to download a theme (${response.status}): ${theme}`);
            }
            content = await response.text();
          } catch (error) {
            err(error);
            break;
          }
          if (!content) {
            log.warn(`Skipped empty name: ${theme}`);
            continue;
          }
          let jsdoc = content.match(/\/\*\*[\s\S]*?\*\//);
          let manifest = '';
          if (jsdoc)
            manifest = jsdoc[0];
          fs.writeFileSync(save, content);
          if (manifest) {
            log.ok(`${theme}/${name} is added, printing manifest`);
            log.ok(`Start preparing manifest: ${theme}/${name}`, options.verbose);
            manifestf(manifest);
          }
        }
      }
    } catch (error) {
      err(error);
    }
  });

export {command};
