# GitHub Actions - Clean up UAT

When a pull request is closed:

 - Delete associated data (e.g. MySQL database)
 - Delete packages (Docker images) from GHCR
 - Remove the Application YAML file from the UAT repository

## Configuration

Name | Description | Default
--- | --- | ---
package-names | **Required** A JSON string containing an array of the package names: https://github.com/stickeeuk/REPOSITTORY_NAME/pkgs/container/PACKAGE_NAME, e.g. `'["my-app", "my-nginx"]'` |
github-token | **Required** A GitHub Personal Access Token to access the UAT repository and packages |
gooee-actions | A JSON string containing an array of gooee actions | `'["cache:clear", "queue:clear", "db:drop"]'`
repository-name | The repository name (and project directory name in the UAT respository) | `${{ github.event.repository.name }}`
subdomain | The subdomain the primary ingress should be on (usually `pr-<Pull Request ID>`) | `pr-${{ github.event.pull_request.number }}`
branch-name | The branch name the PR is targeting - used to get the Deployment | `${{ github.head_ref }}`
application-file | The path to the application-uat.yaml file | `${{ github.workspace }}/uat/uat/${{ github.event.repository.name }}/applications/${{ github.event.repository.name }}-${{ github.event.pull_request.number }}.yaml`
version | The deployment's docker image(s) version (tag) | `${{ github.event.pull_request.number }}`

## Usage

> :warning: **PAT required** This requires a Personal Access Token - using `secrets.GITHUB_TOKEN` will not work.

```
- name: Clean up UAT
    uses: stickeeuk/github-actions/clean-up-uat@main
    with:
      package-names: '["my-app", "my-nginx"]'
      github-token: ${{ secrets.PAT }}
```

## Development

1. Start up a Node Docker machine

    ```
    docker run \
      --rm \
      -it \
      -v /$(pwd)://app \
      --entrypoint //bin/sh \
      node:16-alpine
    ```

2. Build the script

    ```
    cd /app
    ./build.sh
    ```

3. Run the script. All `requiredInputs` should be uppercased and prefixed with `INPUT_`, then supplied to the app via `env`, for example (NOTE: this is a single command):

    ```
    env 'INPUT_PACKAGE-NAMES=["test-1", "test-2"]' \
      env 'INPUT_GITHUB-TOKEN=ghp_ABC123' \
      ... \
      node dist/main.mjs
    ```
