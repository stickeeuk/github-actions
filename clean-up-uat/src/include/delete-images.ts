import { githubApi } from './helpers';

/**
 * Delete images
 *
 * @see https://docs.github.com/en/rest/packages#get-all-package-versions-for-a-package-owned-by-an-organization
 */
 export async function deleteImages(packageName: string, tag: string): Promise<void> {
  const response = await githubApi(`/orgs/stickeeuk/packages/container/${packageName}/versions`);
  const data = await response.json() as Array<{ id: number, metadata: {container: { tags: string[] }}}>;

  for (const version of data) {
    if (version.metadata.container.tags.includes(tag) && (version.metadata.container.tags.length === 1)) {
      await deleteVersion(packageName, version.id);
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
