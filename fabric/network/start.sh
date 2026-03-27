#!/bin/bash

# start.sh - Basic script to spin up the DNAProof Fabric Network
echo "Starting DNAProof Fabric Local Network..."

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Bring up the network
docker-compose up -d

echo "Fabric Network is up. You can now deploy chaincode."
echo "Access CA at http://localhost:7054"
echo "Peer nodes available at localhost:7051"
