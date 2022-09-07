import * as core from '@actions/core';
import type { RequestInfo, RequestInit, Response } from 'node-fetch';
import fetch from 'node-fetch';
import { promisify } from 'node:util';
import childProcess from 'node:child_process';
import { ObjectEncodingOptions } from 'node:fs';

const exec = promisify(childProcess.exec);

/**
 * Run a command in a shell
 *
 * @param command The command to run
 * @param options The options to pass to the command
 *
 * @return The result of the command
 */
export async function run(
  command: string,
  options?: (ObjectEncodingOptions & childProcess.ExecOptions) | null | undefined
): Promise<{
  stdout: string | Buffer;
  stderr: string | Buffer;
}> {
  try {
    console.log(`Running command: ${command}`);

    const response = await exec(command, options);

    console.log(response.stdout);
    console.log(response.stderr);

    return response;
  } catch (error) {
    console.log("Error running command: " + command);

    throw error;
  }
}

export async function githubApi(url: RequestInfo, init?: RequestInit): Promise<Response> {
  const githubToken = core.getInput('github-token', { required: true });
  const options = {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Accept: 'application/vnd.github+json',
      Authorization: `token ${githubToken}`,
    },
  };

  console.log(`${init?.method ?? 'GET'} https://api.github.com${url}`);

  const response = await fetch(`https://api.github.com${url}`, options);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response;
}
