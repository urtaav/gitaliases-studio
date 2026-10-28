import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isolatedEnv, tmp } from './helpers';

export interface Person {
  name: string;
  email: string;
}

/** A throwaway repository with an isolated global config. */
export function makeRepo(prefix: string) {
  const dir = tmp(prefix);
  const env = isolatedEnv(dir);
  const git = (args: string[], opts: { who?: Person; date?: string; input?: string } = {}) =>
    spawnSync('git', args, {
      cwd: dir,
      encoding: 'utf8',
      input: opts.input,
      env: {
        ...env,
        ...(opts.who && {
          GIT_AUTHOR_NAME: opts.who.name,
          GIT_AUTHOR_EMAIL: opts.who.email,
          GIT_COMMITTER_NAME: opts.who.name,
          GIT_COMMITTER_EMAIL: opts.who.email,
        }),
        ...(opts.date && { GIT_AUTHOR_DATE: opts.date, GIT_COMMITTER_DATE: opts.date }),
      },
    });
  git(['init', '-q', '-b', 'main']);
  git(['config', '--global', 'user.name', 'Test']);
  git(['config', '--global', 'user.email', 'test@example.com']);
  const commit = (msg: string, who: Person, date: string, file?: [string, string]) => {
    if (file) {
      writeFileSync(join(dir, file[0]), file[1]);
      git(['add', file[0]]);
    }
    const r = git(['commit', '-q', '--allow-empty', '-m', msg], { who, date });
    if (r.status !== 0) throw new Error(r.stderr);
  };
  /** Sets an alias the way git stores it, without any shell quoting in between. */
  const alias = (name: string, value: string) => git(['config', '--global', `alias.${name}`, value]);
  return { dir, env, git, commit, alias };
}
