import * as core from '@actions/core';
import { GooeeApi } from './include/gooee';
import { deleteImages } from './include/delete-images';
import { deleteDeployment } from './include/delete-deployment';
import { deleteApplication } from './include/delete-application';

const requiredInputs = [
  'package-names',
  'gooee-actions',
  'repository-name',
  'subdomain',
  'github-token',
  'branch-name',
  'application-file',
  'version',
];

for (const requiredInput of requiredInputs) {
  core.getInput(requiredInput, { required: true });
}

const projectName = core.getInput('repository-name');

// Clean up application-related resources
const gooeeActions = JSON.parse(core.getInput('gooee-actions')) as string[];
const gooeeApi = new GooeeApi(projectName, core.getInput('subdomain'));

for (const action of gooeeActions) {
  await gooeeApi.run(action);
}

// Delete the application
await deleteApplication(core.getInput('application-file'));

// Delete old Docker images
const packageNames = JSON.parse(core.getInput('package-names')) as string[];
const version = core.getInput('version') as string;

for (const packageName of packageNames) {
  await deleteImages(packageName, version);
}

// Delete the Deployment from the Pull Request
await deleteDeployment(projectName, core.getInput('branch-name'));
