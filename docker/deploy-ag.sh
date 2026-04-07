#!/bin/bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/data/dify}"
DOCKER_DIR="${DOCKER_DIR:-$REPO_DIR/docker}"
DEPLOY_GIT_REF="${DEPLOY_GIT_REF:-main}"

cd "$REPO_DIR"

echo "Fetching latest code and tags..."
git fetch origin --tags

if git show-ref --verify --quiet "refs/tags/$DEPLOY_GIT_REF"; then
  echo "Checking out release tag: $DEPLOY_GIT_REF"
  git checkout --force "$DEPLOY_GIT_REF"
elif git ls-remote --exit-code --heads origin "$DEPLOY_GIT_REF" >/dev/null 2>&1; then
  echo "Checking out branch: $DEPLOY_GIT_REF"
  git checkout -B "$DEPLOY_GIT_REF" "origin/$DEPLOY_GIT_REF"
else
  echo "Deployment ref not found: $DEPLOY_GIT_REF"
  exit 1
fi

cd "$DOCKER_DIR"

if [[ ! -f ".env" ]]; then
  echo "Creating .env from template..."
  cp .env.example .env
fi

echo "Restoring classic root Docker entrypoints..."
ln -sfn docker/docker-compose.yaml "$REPO_DIR/docker-compose.yaml"
ln -sfn docker/.env "$REPO_DIR/.env"
ln -sfn docker/.env.example "$REPO_DIR/.env.example"

echo "Syncing environment template..."
chmod +x dify-env-sync.sh
./dify-env-sync.sh

echo "Rebuilding and restarting AG containers..."
docker compose up -d --build

echo "AG deployment complete!"
