#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
cd ${DIR}/../;
docker build -f docker/production.dockerfile -t "awesome1888/db-backuper:latest" .;
docker push awesome1888/db-backuper;
