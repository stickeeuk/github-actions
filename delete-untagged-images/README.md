# GitHub Actions - Delete Untagged Images

When a new version of an image is pushed to GHCR, the old one is untagged but not deleted.
This action will delete all untagged images.

## Configuration

Name | Description
--- | ---
package-names | **Required** A JSON string containing an array of the package names: https://github.com/stickeeuk/REPOSITTORY_NAME/pkgs/container/PACKAGE_NAME, e.g. `'["my-app", "my-nginx"]'`
github-token | **Required** A GitHub token to access the UAT repository

## Usage

```
- name: Delete untagged images
    uses: stickeeuk/github-actions/delete-untagged-images@main
    with:
      package-names: '["my-app", "my-nginx"]'
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
      node dist/main.mjs
    ```
