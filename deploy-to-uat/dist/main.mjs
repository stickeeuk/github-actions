import * as core from '@actions/core';
import fetch from 'node-fetch';
import { promisify } from 'node:util';
import childProcess from 'node:child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

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

const requiredInputs = [
  "app-id",
  "git-sha",
  "github-token",
  "subdomain",
  "repository-name",
  "version",
  "branch-name",
  "extra-variables",
  "application-template-file",
  "application-output-file"
];
for (const requiredInput of requiredInputs) {
  core.getInput(requiredInput, { required: true });
}
const repositoryName = core.getInput("repository-name");
const branchName = core.getInput("branch-name");
const extraVariables = JSON.parse(core.getInput("extra-variables"));
await deleteOldDeployments();
const deploymentId = await createDeployment();
const variables = getVariables({
  ...extraVariables,
  DEPLOYMENT_ID: deploymentId.toString(),
  APP_ID_SNAKE: core.getInput("app-id").replace(/-/g, "_")
});
await createApplicationYaml(variables);
await commitAndPush();
async function deleteOldDeployments() {
  const response = await githubApi(`/repos/stickeeuk/${repositoryName}/deployments?environment=uat&ref=${branchName}`);
  const data = await response.json();
  for (const deployment of data) {
    await githubApi(`/repos/stickeeuk/${repositoryName}/deployments/${deployment.id}/statuses`, {
      method: "POST",
      body: JSON.stringify({
        environment: "uat",
        state: "inactive",
        description: "Cleanup from CI."
      })
    });
    await githubApi(`/repos/stickeeuk/${repositoryName}/deployments/${deployment.id}`, {
      method: "DELETE"
    });
  }
}
async function createDeployment() {
  const response = await githubApi(`/repos/stickeeuk/${repositoryName}/deployments`, {
    method: "POST",
    body: JSON.stringify({
      ref: branchName,
      description: "Deployment from UAT",
      transient_environment: true,
      environment: "uat",
      auto_merge: false,
      required_contexts: []
    })
  });
  const data = await response.json();
  console.log(data);
  return data.id;
}
function getVariables(extraVariables2) {
  const envVariables = Object.keys(process.env).filter((key) => key.startsWith("INPUT_") && key !== "INPUT_EXTRA-VARIABLES").map((key) => {
    return {
      name: key.substring(6).replace(/-/g, "_"),
      value: process.env[key] || ""
    };
  });
  const extras = Object.keys(extraVariables2).map((key) => {
    return {
      name: key,
      value: extraVariables2[key]
    };
  });
  return [...envVariables, ...extras];
}
async function createApplicationYaml(variables2) {
  const yaml = readFileSync(core.getInput("application-template-file"), "utf8");
  const result = variables2.reduce((yaml2, { name, value }) => {
    return yaml2.replace(new RegExp(`\\{\\{\\s*\\.${name}\\s*\\}\\}`, "g"), value);
  }, yaml);
  const notFound = [...result.matchAll(/\{\{\s*\.(\w+)\s*\}\}/g)].map((match) => match[1]).filter((value, index, self) => self.indexOf(value) === index);
  if (notFound.length) {
    throw new Error(`Variables not found: ${notFound.join(", ")}`);
  }
  writeFileSync(core.getInput("application-output-file"), result);
}
async function commitAndPush() {
  const options = {
    cwd: path.dirname(core.getInput("application-output-file"))
  };
  await run("git config user.name github-actions", options);
  await run("git config user.email github-actions@github.com", options);
  await run(`git add ${core.getInput("application-output-file")}`, options);
  await run(`git commit -m "Adding ${core.getInput("app-id")} from ${core.getInput("repository-name")} at ${core.getInput("git-sha")}"`, options);
  await run("git push", options);
}
