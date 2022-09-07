import * as core from '@actions/core';
import { githubApi, run } from './helpers';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const requiredInputs = [
  'app-id',
  'git-sha',
  'github-token',
  'subdomain',
  'repository-name',
  'version',
  'branch-name',
  'extra-variables',
  'application-template-file',
  'application-output-file',
];

for (const requiredInput of requiredInputs) {
  core.getInput(requiredInput, { required: true });
}

const repositoryName = core.getInput('repository-name');
const branchName = core.getInput('branch-name');
const extraVariables = JSON.parse(core.getInput('extra-variables')) as Record<string, string>;

await deleteOldDeployments();
const deploymentId = await createDeployment();
const variables = getVariables({
  ...extraVariables,
  DEPLOYMENT_ID: deploymentId.toString(),
  APP_ID_SNAKE: core.getInput('app-id').replace(/-/g, '_'),
});
await createApplicationYaml(variables);
await commitAndPush();

/**
 * Delete old deployments
 *
 * @see https://docs.github.com/en/rest/reference/deployments#list-deployments
 */
async function deleteOldDeployments(): Promise<void> {
  // Get the Deployment ID if one already exists
  const response = await githubApi(`/repos/stickeeuk/${repositoryName}/deployments?environment=uat&ref=${branchName}`);
  const data = await response.json() as Array<{ id: number }>;

  for (const deployment of data) {
    // Make sure it's inactive by creating a new status
    await githubApi(`/repos/stickeeuk/${repositoryName}/deployments/${deployment.id}/statuses`, {
      method: 'POST',
      body: JSON.stringify({
        environment: "uat",
        state: "inactive",
        description: "Cleanup from CI.",
      }),
    });

    // Delete the deployment
    await githubApi(`/repos/stickeeuk/${repositoryName}/deployments/${deployment.id}`, {
      method: 'DELETE',
    });
  }
}

/**
 * Create a Deployment via the GitHub API
 *
 * @see https://docs.github.com/en/rest/deployments/deployments#create-a-deployment
 *
 * @returns The Deployment ID
 */
async function createDeployment(): Promise<number> {
  const response = await githubApi(`/repos/stickeeuk/${repositoryName}/deployments`, {
    method: 'POST',
    body: JSON.stringify({
      ref: branchName,
      description: "Deployment from UAT",
      transient_environment: true,
      environment: "uat",
      required_contexts: [],
    }),
  });

  const data = await response.json() as { id: number };

  console.log(data);

  return data.id;
}

/**
 * Get the variables for the deployment
 *
 * @param extraVariables Extra variables to add to the deployment
 *
 * @return The variables for the deployment
 */
function getVariables(extraVariables: Record<string, string>): Array<{name: string, value: string}> {
  const envVariables = Object.keys(process.env)
    .filter(key => key.startsWith('INPUT_') && key !== 'INPUT_EXTRA-VARIABLES')
    .map((key) => {
      return {
        name: key.substring(6).replace(/-/g, '_'),
        value: process.env[key] || '',
      };
    });

  const extras = Object.keys(extraVariables)
    .map((key) => {
      return {
        name: key,
        value: extraVariables[key],
      };
    });

  return [...envVariables, ...extras];
}

/**
 * Create the application YAML file
 *
 * @param variables The variables to use in the YAML file
 */
async function createApplicationYaml(variables: Array<{name: string, value: string}>): Promise<void> {
  // Load the template
  const yaml = readFileSync(core.getInput('application-template-file'), 'utf8');

  // Replace the variables
  const result = variables.reduce((yaml, {name, value}) => {
    return yaml.replace(new RegExp(`\\{\\{\\s*\\.${name}\\s*\\}\\}`, 'g'), value);
  }, yaml);

  // Check for any variables that weren't replaced
  const notFound = [...result.matchAll(/\{\{\s*\.(\w+)\s*\}\}/g)]
    .map(match => match[1])
    .filter((value, index, self) => self.indexOf(value) === index);

  if (notFound.length) {
    throw new Error(`Variables not found: ${notFound.join(', ')}`);
  }

  // Write the file
  writeFileSync(core.getInput('application-output-file'), result);
}

/**
 * Commit and push the application YAML file
 */
async function commitAndPush(): Promise<void> {
  const options =  {
    cwd: path.dirname(core.getInput('application-output-file')),
  };

  await run('git config user.name github-actions', options);
  await run('git config user.email github-actions@github.com', options);
  await run(`git add ${core.getInput('application-output-file')}`, options);
  await run(`git commit -m "Adding ${core.getInput('app-id')} from ${core.getInput('repository-name')} at ${core.getInput('git-sha')}"`, options);
  await run('git push', options);
}
