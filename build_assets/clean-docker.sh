#!/bin/bash

docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker rmi registry.dough10.me/customradio:latest
docker rmi $(docker images -q)