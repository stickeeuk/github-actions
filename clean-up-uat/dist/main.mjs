import * as core from '@actions/core';
import fetch, { Headers } from 'node-fetch';
import { promisify } from 'node:util';
import childProcess from 'node:child_process';
import path from 'path';

class GooeeApi {
  repositoryName;
  subdomain;
  constructor(repositoryName, subdomain) {
    this.repositoryName = repositoryName;
    this.subdomain = subdomain;
  }
  async run(action) {
    const url = `https://${this.subdomain}-gooee.${this.repositoryName}.uat.stickeedev.com/action`;
    const headers = new Headers();
    headers.set("Authorization", "Basic " + Buffer.from("stickee:guest").toString("base64"));
    const data = new URLSearchParams({ action });
    console.log(`POST ${url} : ${data.toString()}`);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: data
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    console.log(await response.text());
  }
}

const exec = promisify(childProcess.exec);
async function run(command, options) {
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

async function deleteImages(packageName, tag) {
  const response = await githubApi(`/orgs/stickeeuk/packages/container/${packageName}/versions`);
  const data = await response.json();
  for (const version of data) {
    if (version.metadata.container.tags.includes(tag) && version.metadata.container.tags.length === 1) {
      await deleteVersion(packageName, version.id);
    }
  }
}
async function deleteVersion(packageName, id) {
  await githubApi(`/orgs/stickeeuk/packages/container/${packageName}/versions/${id}`, {
    method: "DELETE"
  });
}

async function deleteDeployment(repositoryName, ref) {
  const deploymentId = await getDeploymentId(repositoryName, ref);
  if (deploymentId === null) {
    return;
  }
  await setInactive(repositoryName, deploymentId);
  await githubApi(`/repos/stickeeuk/${repositoryName}/deployments/${deploymentId}`, {
    method: "DELETE"
  });
}
async function getDeploymentId(repositoryName, ref) {
  const response = await githubApi(`/repos/stickeeuk/${repositoryName}/deployments?environment=uat&ref=${ref}`);
  const data = await response.json();
  return data.length ? data[0].id : null;
}
async function setInactive(repositoryName, deploymentId) {
  const data = {
    environment: "uat",
    state: "inactive",
    description: "Cleanup from CI."
  };
  await githubApi(`/repos/stickeeuk/${repositoryName}/deployments/${deploymentId}/statuses`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

async function deleteApplication(file) {
  const options = {
    cwd: path.dirname(file)
  };
  await run("git config user.name github-actions", options);
  await run("git config user.email github-actions@github.com", options);
  await run(`git rm ${file}`, options);
  await run(`git commit -m "Deleting ${file}"`, options);
  await run("git push", options);
}

const requiredInputs = [
  "package-names",
  "gooee-actions",
  "repository-name",
  "subdomain",
  "github-token",
  "branch-name",
  "application-file",
  "version"
];
for (const requiredInput of requiredInputs) {
  core.getInput(requiredInput, { required: true });
}
const projectName = core.getInput("repository-name");
const gooeeActions = JSON.parse(core.getInput("gooee-actions"));
const gooeeApi = new GooeeApi(projectName, core.getInput("subdomain"));
for (const action of gooeeActions) {
  await gooeeApi.run(action);
}
await deleteApplication(core.getInput("application-file"));
const packageNames = JSON.parse(core.getInput("package-names"));
const version = core.getInput("version");
for (const packageName of packageNames) {
  await deleteImages(packageName, version);
}
await deleteDeployment(projectName, core.getInput("branch-name"));
