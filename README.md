# GitHub Actions

Custom GitHub actions.

Each action should be in its own subdirectory, and have a `build.sh` file for any build steps required.

> :warning: **This repository is public.** These actions are designed for internal stickee use only, but GitHub does not support private actions.

## Workflows

When the `main` branch is pushed, it will run `*/build.sh` to build each action, then commit the results to this repository.
