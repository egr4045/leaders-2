/**
 * ContainerRuntime backed by the `docker compose` CLI. `up` starts the game's stack; `down` stops
 * it (keeps containers for a fast restart); `status` checks for running containers.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { GameManifest } from './manifest.js';
import type { ContainerRuntime } from './ports.js';

const run = promisify(execFile);

const compose = (g: GameManifest, args: string[]): Promise<{ stdout: string }> =>
  run('docker', ['compose', '-p', g.composeProject, '--project-directory', g.composeDir, ...args], {
    timeout: 120_000,
  });

export const dockerRuntime: ContainerRuntime = {
  async status(g) {
    try {
      const { stdout } = await compose(g, ['ps', '-q']);
      return stdout.trim().length > 0 ? 'running' : 'stopped';
    } catch {
      return 'stopped';
    }
  },
  async up(g) {
    await compose(g, ['up', '-d']);
  },
  async down(g) {
    await compose(g, ['stop']);
  },
};
