#!/bin/bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/data/dify}"
DOCKER_DIR="${DOCKER_DIR:-$REPO_DIR/docker}"

cd "$REPO_DIR"

echo "Pulling latest code..."
git pull origin main

cd "$DOCKER_DIR"

if [[ ! -f ".env" ]]; then
  echo "Creating .env from template..."
  cp .env.example .env
fi

echo "Syncing environment template..."
chmod +x dify-env-sync.sh
./dify-env-sync.sh

echo "Rebuilding and restarting AG containers..."
docker compose up -d --build

echo "AG deployment complete!"
