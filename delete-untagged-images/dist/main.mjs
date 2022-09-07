import * as core from '@actions/core';
import fetch from 'node-fetch';

async function githubApi(url, init) {
  const githubToken = core.getInput("github-token", { required: true });
  const options = {
    ...init,
    headers: {
      ...init?.headers || {},
      Accept: "application/vnd.github+json",
      Authorization: `token ${githubToken}`
    }
  };
  console.log(`${init?.method ?? "GET"} https://api.github.com${url}`);
  const response = await fetch(`https://api.github.com${url}`, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response;
}

const requiredInputs = [
  "package-names",
  "github-token"
];
for (const requiredInput of requiredInputs) {
  core.getInput(requiredInput, { required: true });
}
const packageNames = JSON.parse(core.getInput("package-names"));
for (var packageName of packageNames) {
  await deleteVersions(packageName);
}
async function deleteVersions(packageName) {
  const response = await githubApi(`/orgs/stickeeuk/packages/container/${packageName}/versions`);
  const data = await response.json();
  for (const version of data) {
    if (!version.metadata.container.tags.length) {
      deleteVersion(packageName, version.id);
    }
  }
}
async function deleteVersion(packageName, id) {
  await githubApi(`/orgs/stickeeuk/packages/container/${packageName}/versions/${id}`, {
    method: "DELETE"
  });
}
