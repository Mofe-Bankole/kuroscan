#!/bin/bash
# start.sh

set -a  #
source .env
set +a

kora --config ./kora.toml rpc start --signers-config ./signers.toml


nodemon src/server.ts
