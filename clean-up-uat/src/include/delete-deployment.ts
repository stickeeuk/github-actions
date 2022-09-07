import { githubApi } from './helpers';

/**
 * Delete a deployment
 *
 * @see https://docs.github.com/en/rest/deployments/deployments
 */
 export async function deleteDeployment(repositoryName: string, ref: string): Promise<void> {
  const deploymentId = await getDeploymentId(repositoryName, ref);

  if (deploymentId === null) {
    return;
  }

  await setInactive(repositoryName, deploymentId);

  await githubApi(`/repos/stickeeuk/${repositoryName}/deployments/${deploymentId}`, {
    method: 'DELETE',
  });
}

/**
 * Get the deployment ID
 */
async function getDeploymentId(repositoryName: string, ref: string): Promise<null|number> {
  const response = await githubApi(`/repos/stickeeuk/${repositoryName}/deployments?environment=uat&ref=${ref}`);
  const data = await response.json() as Array<{ id: number}>;

  return data.length ? data[0].id : null;
}

/**
 * Set the deployment to inactive so it is allowed to be deleted
 */
async function setInactive(repositoryName: string, deploymentId: number): Promise<void> {
  const data = {
    environment: 'uat',
    state: 'inactive',
    description: 'Cleanup from CI.',
  };

  await githubApi(`/repos/stickeeuk/${repositoryName}/deployments/${deploymentId}/statuses`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
