#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

function launch() {
  local yaml=$1
  cat ${yaml} \
    | sed 's,{{FABRIC_CONTAINER_REGISTRY}},'${FABRIC_CONTAINER_REGISTRY}',g' \
    | sed 's,{{FABRIC_VERSION}},'${FABRIC_VERSION}',g' \
    | sed 's,{{COUCHDB_IMAGE}},'${COUCHDB_IMAGE}',g' \
    | kubectl -n $NS apply -f -
}

function launch_orderers() {
  push_fn "Launching orderers"

  apply_template kube/org0/org0-orderer1.yaml
  apply_template kube/org0/org0-orderer2.yaml
  apply_template kube/org0/org0-orderer3.yaml

  kubectl -n $NS rollout status deploy/org0-orderer1
  kubectl -n $NS rollout status deploy/org0-orderer2
  kubectl -n $NS rollout status deploy/org0-orderer3

  pop_fn
}

function launch_peers() {
  push_fn "Launching peers"

  apply_template kube/org1/org1-peer1.yaml
  apply_template kube/org1/org1-peer2.yaml
  apply_template kube/org2/org2-peer1.yaml
  apply_template kube/org2/org2-peer2.yaml

  kubectl -n $NS rollout status deploy/org1-peer1
  kubectl -n $NS rollout status deploy/org1-peer2
  kubectl -n $NS rollout status deploy/org2-peer1
  kubectl -n $NS rollout status deploy/org2-peer2

  # Port forward for couchDB UI
#  kubectl -n $NS port-forward deploy/org1-peer1 5984:5984 &
  pop_fn
}

# todo: enroll org admin LOCALLY from the host OS
#  fabric-ca-client register --id.name org1-admin --id.secret org1adminpw  --id.type admin   --url https://org1-ca --mspdir $FABRIC_CA_CLIENT_HOME/org1-ca/rcaadmin/msp --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert"
#  fabric-ca-client enroll --url https://org1-admin:org1adminpw@org1-ca  --mspdir /var/hyperledger/fabric/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
#  cp /var/hyperledger/fabric/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/*_sk /var/hyperledger/fabric/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/server.key
#  cp /var/hyperledger/fabric/organizations/peerOrganizations/org1.example.com/peers/org1-peer1.org1.example.com/msp/config.yaml /var/hyperledger/fabric/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/config.yaml

#  fabric-ca-client register --id.name org1-admin --id.secret org1adminpw  --id.type admin   --url https://org1-ca --mspdir $FABRIC_CA_CLIENT_HOME/org1-ca/rcaadmin/msp --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert"
#  fabric-ca-client enroll --url https://org1-admin:org1adminpw@org1-ca  --mspdir /var/hyperledger/fabric/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
#  cp /var/hyperledger/fabric/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/*_sk /var/hyperledger/fabric/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/server.key
#  cp /var/hyperledger/fabric/organizations/peerOrganizations/org1.example.com/peers/org1-peer1.org1.example.com/msp/config.yaml /var/hyperledger/fabric/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/config.yaml

#  fabric-ca-client register --id.name org2-admin --id.secret org2adminpw  --id.type admin   --url https://org2-ca --mspdir $FABRIC_CA_CLIENT_HOME/org2-ca/rcaadmin/msp --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert"
#  fabric-ca-client enroll --url https://org2-admin:org2adminpw@org2-ca  --mspdir /var/hyperledger/fabric/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
#  cp /var/hyperledger/fabric/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore/*_sk /var/hyperledger/fabric/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore/server.key
#  cp /var/hyperledger/fabric/organizations/peerOrganizations/org2.example.com/peers/org2-peer1.org2.example.com/msp/config.yaml /var/hyperledger/fabric/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/config.yaml


# Each network node needs a registration, enrollment, and MSP config.yaml
function create_node_local_MSP() {
  local node_type=$1
  local org=$2
  local node=$3
  local csr_hosts=$4
  local id_name=${org}-${node}
  local id_secret=${node_type}pw
  local ca_name=${org}-ca

  cat <<EOF | kubectl -n $NS exec deploy/${ca_name} -i -- /bin/sh

  set -x
  export FABRIC_CA_CLIENT_HOME=/var/hyperledger/fabric-ca-client
  export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/hyperledger/fabric/config/tls/ca.crt

  # Each identity in the network needs a registration and enrollment.
  fabric-ca-client register \
    --id.name ${id_name} \
    --id.secret ${id_secret} \
    --id.type ${node_type} \
    --url https://${ca_name} \
    --mspdir /var/hyperledger/fabric-ca-client/${ca_name}/rcaadmin/msp

  fabric-ca-client enroll \
    --url https://${id_name}:${id_secret}@${ca_name} \
    --csr.hosts ${csr_hosts} \
    --mspdir /var/hyperledger/fabric/organizations/${node_type}Organizations/${org}.example.com/${node_type}s/${id_name}.${org}.example.com/msp

  # Create local MSP config.yaml
  echo "NodeOUs:
    Enable: true
    ClientOUIdentifier:
      Certificate: cacerts/${org}-ca.pem
      OrganizationalUnitIdentifier: client
    PeerOUIdentifier:
      Certificate: cacerts/${org}-ca.pem
      OrganizationalUnitIdentifier: peer
    AdminOUIdentifier:
      Certificate: cacerts/${org}-ca.pem
      OrganizationalUnitIdentifier: admin
    OrdererOUIdentifier:
      Certificate: cacerts/${org}-ca.pem
      OrganizationalUnitIdentifier: orderer" > /var/hyperledger/fabric/organizations/${node_type}Organizations/${org}.example.com/${node_type}s/${id_name}.${org}.example.com/msp/config.yaml
EOF
}

function create_orderer_local_MSP() {
  local org=$1
  local orderer=$2
  local csr_hosts=${org}-${orderer}

  create_node_local_MSP orderer $org $orderer $csr_hosts
}

function create_peer_local_MSP() {
  local org=$1
  local peer=$2
  local csr_hosts=localhost,${org}-${peer},${org}-peer-gateway-svc

  create_node_local_MSP peer $org $peer $csr_hosts
}

function create_local_MSP() {
  push_fn "Creating local node MSP"

  create_orderer_local_MSP org0 orderer1
  create_orderer_local_MSP org0 orderer2
  create_orderer_local_MSP org0 orderer3

  create_peer_local_MSP org1 peer1
  create_peer_local_MSP org1 peer2

  create_peer_local_MSP org2 peer1
  create_peer_local_MSP org2 peer2

  pop_fn
}
#
## TLS certificates are isused by the CA's Issuer, stored in a Kube secret, and mounted into the pod at /var/hyperledger/fabric/config/tls.
## For consistency with the Fabric-CA guide, his function copies the orderer's TLS certs into the traditional Fabric MSP / folder structure.
#function extract_orderer_tls_cert() {
#  local orderer=$1
#
#  echo 'set -x
#
#  mkdir -p /var/hyperledger/fabric/organizations/ordererOrganizations/org0.example.com/orderers/'${orderer}'.org0.example.com/tls/signcerts/
#
#  cp \
#    var/hyperledger/fabric/config/tls/tls.crt \
#    /var/hyperledger/fabric/organizations/ordererOrganizations/org0.example.com/orderers/'${orderer}'.org0.example.com/tls/signcerts/cert.pem
#
#  ' | exec kubectl -n $NS exec deploy/${orderer} -i -c main -- /bin/sh
#}
#
#function extract_orderer_tls_certs() {
#  push_fn "Extracting orderer TLS certs to local MSP folder"
#
#  extract_orderer_tls_cert org0-orderer1
#  extract_orderer_tls_cert org0-orderer2
#  extract_orderer_tls_cert org0-orderer3
#
#  pop_fn
#}

function build_and_push_images_locally() {
  local env=$1
  local image=$2
  set -x

  if [ "${env}" == "dev" ]; then
    local dockerFile="DockerfileDev"
  else
    local dockerFile="Dockerfile"
  fi

  if [ "${image}" == "cc" ]; then
      docker rmi $(docker images | grep ${CHAINCODE_NAME}) --force || true
      docker build -f chaincode/${CHAINCODE_NAME}/${dockerFile} -t ${CHAINCODE_IMAGE} chaincode/${CHAINCODE_NAME} --no-cache
      docker tag ${CHAINCODE_IMAGE} ${LOCAL_REGISTRY_HOST}:${LOCAL_REGISTRY_PORT}/${CHAINCODE_IMAGE}
      docker push ${LOCAL_REGISTRY_HOST}:${LOCAL_REGISTRY_PORT}/${CHAINCODE_IMAGE}
  elif [ "${image}" == "app" ]; then
      docker rmi $(docker images | grep ${APP_NAME}) --force || true
      docker build -f application/${APP_NAME}/${dockerFile} -t ${APP_IMAGE} application/${APP_NAME} --no-cache
      docker tag ${APP_IMAGE} ${LOCAL_REGISTRY_HOST}:${LOCAL_REGISTRY_PORT}/${APP_IMAGE}
      docker push ${LOCAL_REGISTRY_HOST}:${LOCAL_REGISTRY_PORT}/${APP_IMAGE}
  fi

}


function network_up() {

  # Kube config
  init_namespace
  init_storage_volumes
  load_org_config

  # Network TLS CAs
  init_tls_cert_issuers

  # Network ECert CAs
  launch_ECert_CAs
  enroll_bootstrap_ECert_CA_users

  # Test Network
  create_local_MSP

  launch_orderers
  launch_peers

#  extract_orderer_tls_certs
}

function network_resume() {
    # Kube config
    init_namespace
    init_storage_volumes

#    load_org_config

    # Network TLS CAs
    launch_TLS_CAs
#    enroll_bootstrap_TLS_CA_users

    # Network ECert CAs
#    register_enroll_ECert_CA_bootstrap_users
    launch_ECert_CAs
#    enroll_bootstrap_ECert_CA_users

    # Test Network
#    create_local_MSP
    launch_orderers
    launch_peers
}


function stop_services() {
  push_fn "Stopping Fabric services"

  kubectl -n $NS delete ingress --all
  kubectl -n $NS delete deployment --all
  kubectl -n $NS delete pod --all
  kubectl -n $NS delete service --all
  kubectl -n $NS delete cert --all
  kubectl -n $NS delete issuer --all
  kubectl -n $NS delete secret --all

  pop_fn
}

function scrub_org_volumes() {
  push_fn "Scrubbing Fabric volumes"
  
  # clean job to make this function can be rerun
  kubectl -n $NS delete jobs --all
  kubectl -n $NS delete configmap --all

  # scrub all pv contents
  kubectl -n $NS create -f kube/job-scrub-fabric-volumes.yaml
  kubectl -n $NS wait --for=condition=complete --timeout=60s job/job-scrub-fabric-volumes
  kubectl -n $NS delete jobs --all

  pop_fn
}

function network_down() {
  stop_services
  scrub_org_volumes

  rm -rf $PWD/build
}
