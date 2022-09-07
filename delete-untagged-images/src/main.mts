import * as core from '@actions/core';
import { githubApi } from './helpers';

const requiredInputs = [
  'package-names',
  'github-token',
];

for (const requiredInput of requiredInputs) {
  core.getInput(requiredInput, { required: true });
}

const packageNames = JSON.parse(core.getInput('package-names')) as string[];

for (var packageName of packageNames) {
  await deleteVersions(packageName);
}

/**
 * Delete untagged versions
 *
 * @see https://docs.github.com/en/rest/packages#get-all-package-versions-for-a-package-owned-by-an-organization
 */
async function deleteVersions(packageName: string): Promise<void> {
  const response = await githubApi(`/orgs/stickeeuk/packages/container/${packageName}/versions`);
  const data = await response.json() as Array<{ id: number, metadata: {container: { tags: string[] }}}>;

  for (const version of data) {
    if (!version.metadata.container.tags.length) {
      deleteVersion(packageName, version.id);
    }
  }
}

/**
 * Delete a version
 *
 * @see https://docs.github.com/en/rest/packages#delete-package-version-for-an-organization
 */
async function deleteVersion(packageName: string, id: number): Promise<void> {
  await githubApi(`/orgs/stickeeuk/packages/container/${packageName}/versions/${id}`, {
    method: 'DELETE',
  });
}
