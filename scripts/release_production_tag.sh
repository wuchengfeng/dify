#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash changes before releasing."
  exit 1
fi

current_branch="$(git branch --show-current)"
if [[ "$current_branch" != "main" ]]; then
  echo "Production release tags must be created from main. Current branch: $current_branch"
  exit 1
fi

release_date="${1:-$(date +%Y%m%d)}"

git fetch origin --tags

max_version=0
while IFS= read -r tag; do
  version="${tag#${release_date}_v}"
  if [[ "$version" =~ ^[0-9]+$ ]] && (( version > max_version )); then
    max_version="$version"
  fi
done < <(git tag --list "${release_date}_v*")

next_version=$((max_version + 1))
release_tag="${release_date}_v${next_version}"

echo "Pushing main to origin..."
git push origin main

echo "Creating release tag: ${release_tag}"
git tag "${release_tag}"

echo "Pushing release tag: ${release_tag}"
git push origin "${release_tag}"

echo "Release complete: ${release_tag}"
