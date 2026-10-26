#!/usr/bin/env bash
# Builds and pushes one app's image from a tree prepared OUTSIDE Docker. Run from the app's directory as its
# `docker:release` script, which turbo starts after `build` (so every workspace dependency's dist exists). The image is
# named after the package without its scope, so a renamed app instance releases under its own name:
#
#   docker-release.sh [--prune]
#
# --prune: the build context is `pnpm deploy --prod` of the app into a temporary directory outside the repository, so the
#          whole context enters the image and no .dockerignore exists to drift (a server that runs its source).
# without: the context is the app directory, whose .dockerignore admits only the built artifacts (a static bundle).
#
# REGISTRIES  space-separated registries, each of which gets every tag (required), e.g. "ghcr.io/acme".
# TAGS        space-separated tags; default `latest`, plus `sha-<8>` on CI (GITHUB_SHA).
# PUSH        0 builds and tags locally without touching a registry; default 1.
# TURBO_HASH  set by turbo per task: the content-addressed `turbo-<hash>` tag. An image already pushed under it is only
#             re-tagged, never rebuilt.
set -euo pipefail
. "$(dirname "$0")/registry-retry.sh"

NAME="$(node -p "require('./package.json').name")"
APP="${NAME#*/}"
PRUNE=""
while [ $# -gt 0 ]; do
    case "$1" in
        --prune) PRUNE=1 ;;
        *) echo >&2 "docker-release.sh: unknown argument $1"; exit 2 ;;
    esac
    shift
done

REGISTRIES="${REGISTRIES:?REGISTRIES is required: the space-separated registries that get every tag, e.g. ghcr.io/acme}"
PUSH="${PUSH:-1}"
# The hash probe reads the FIRST registry only; the registries carry identical content because this is one build.
IMAGE="${REGISTRIES%% *}/$APP"

SHORT_SHA="${GITHUB_SHA:-}"
SHORT_SHA="${SHORT_SHA:0:8}"
TAGS="${TAGS:-latest${SHORT_SHA:+ sha-$SHORT_SHA}}"
HASH_TAG="${TURBO_HASH:+turbo-$TURBO_HASH}"

if [ "$PUSH" = "1" ] && [ -n "$HASH_TAG" ] && docker manifest inspect "$IMAGE:$HASH_TAG" >/dev/null 2>&1; then
    alias_args=()
    for registry in $REGISTRIES; do
        for tag in $TAGS; do
            alias_args+=(--tag "$registry/$APP:$tag")
        done
    done
    echo "content unchanged: aliasing tags onto $IMAGE:$HASH_TAG"
    registry_retry docker buildx imagetools create "${alias_args[@]}" "$IMAGE:$HASH_TAG"
    exit 0
fi

# The pruned copy never lives in the checkout: a test runner or linter walking the repository would find a --prod tree
# whose imports cannot resolve. The trap removes it however the script ends.
CONTEXT="."
if [ -n "$PRUNE" ]; then
    PRUNE_ROOT="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/docker-release-$APP.XXXXXX")"
    trap 'rm -rf "$PRUNE_ROOT"' EXIT
    # A path that does not exist yet, so `pnpm deploy` never has to judge a directory empty.
    CONTEXT="$PRUNE_ROOT/tree"
    pnpm --filter="$NAME" deploy --prod "$CONTEXT"
fi

tag_args=()
for registry in $REGISTRIES; do
    for tag in $TAGS $HASH_TAG; do
        tag_args+=(-t "$registry/$APP:$tag")
    done
done

# What the image says it is: the content-addressed tag, not the commit. Baked into the image, a commit would change
# every build's content and the alias above could never hit. Passed only to a Dockerfile that declares `ARG BUILD_ID`,
# since docker warns about a build-arg nothing consumes.
BUILD_ID="${HASH_TAG:-${SHORT_SHA:+sha-$SHORT_SHA}}"
build_args=()
if grep -q '^ARG BUILD_ID' Dockerfile; then
    build_args+=(--build-arg "BUILD_ID=${BUILD_ID:-unreleased}")
fi

# --provenance=false keeps a plain manifest (not an attestation index), so the hash alias above stays a straight retag.
# -f is explicit because a pruned context lives elsewhere on disk while the Dockerfile is the app's own.
docker build --provenance=false -f Dockerfile "${build_args[@]}" "${tag_args[@]}" "$CONTEXT"

if [ "$PUSH" != "1" ]; then
    echo "PUSH=$PUSH: built ${tag_args[*]} without pushing"
    exit 0
fi
for registry in $REGISTRIES; do
    for tag in $TAGS $HASH_TAG; do
        registry_retry docker push "$registry/$APP:$tag"
    done
done
