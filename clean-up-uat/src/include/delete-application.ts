import { run } from './helpers';
import path from 'path';

/**
 * Delete, commit and push the application YAML file
 */
 export async function deleteApplication(file: string): Promise<void> {
  const options =  {
    cwd: path.dirname(file),
  };

  await run('git config user.name github-actions', options);
  await run('git config user.email github-actions@github.com', options);
  await run(`git rm ${file}`, options);
  await run(`git commit -m "Deleting ${file}"`, options);
  await run('git push', options);
}
