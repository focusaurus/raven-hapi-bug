#!/usr/bin/env bash
cd "$(dirname "$0")/.."
source ./bin/lib/strict-mode.sh
exec docker run --rm --interactive --tty \
  --attach stdin --attach stdout --attach stderr \
  --volume "${PWD}:/opt" \
  --workdir /opt \
  --publish 3000:3000 \
  node:8.4.0 "$@"
