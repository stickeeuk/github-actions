import * as core from '@actions/core';
import type { RequestInfo, RequestInit, Response } from 'node-fetch';
import fetch from 'node-fetch';

/**
 * Make a GitHub API request
 */
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
