# GitHub Actions - Deploy to UAT

Create an ArgoCD application that will cause the branch to be deployed to the [UAT system](https://github.com/stickeeuk/uat).

This action reads the YAML file in `application-template-file`, replaces variables matching `{{ MY_VAR }}`, and commits the new file to the UAT repository.

## Configuration

Name | Description | Default
--- | --- | ---
app-id | The unique name for the Application | `${{ github.event.repository.name }}-${{ github.event.pull_request.number || github.ref_name }}`
git-sha | The Git SHA if the head commit | `${{ github.event.pull_request.head || github.ref_name.sha }}`
github-token | **Required** A GitHub token to access the UAT repository |
subdomain | The subdomain the primary ingress should be on (usually `pr-<Pull Request ID>`) | `pr-${{ github.event.pull_request.number || github.ref_name }}`
repository-name | The repository name (and project directory name in the UAT respository) | `${{ github.event.repository.name }}`
version | The deployments docker image(s) version (tag) | `${{ github.event.pull_request.number || github.ref_name }}`
branch-name | The branch name the PR is targeting - used to get the Deployment | `${{ github.head_ref || github.ref_name }}`
extra-variables | Extra variables to be replaced in the Application YAML file. A JSON string of `Record<string, string>`, e.g. `{"FOO":"bar","X":"123"}` | `[]`
application-template-file | The path to the Application YAML template file | `${{ github.workspace }}/infrastructure/application-uat.yaml`
application-output-file | The path to the Application YAML template file | `${{ github.workspace }}/uat/uat/${{ github.event.repository.name }}/applications/${{ github.event.repository.name }}-${{ github.event.pull_request.number || github.ref_name }}.yaml`

> **NOTE:** An uppercased, snake-cased version of all variables will be available for replacement in the application YAML file.
For example `app-id` becomes `{{ APP_ID }}`

## Usage

```
- name: Commit to UAT
    uses: stickeeuk/github-actions/deploy-to-uat@main
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
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
