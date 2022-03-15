#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

function app_extract_MSP_archives() {
  mkdir -p build/msp
  set -ex
  kubectl -n $NS exec deploy/org1-ca -- tar zcf - -C /var/hyperledger/fabric organizations/peerOrganizations/org1.example.com/msp | tar zxf - -C build/msp
  kubectl -n $NS exec deploy/org2-ca -- tar zcf - -C /var/hyperledger/fabric organizations/peerOrganizations/org2.example.com/msp | tar zxf - -C build/msp

  kubectl -n $NS exec deploy/org1-ca -- tar zcf - -C /var/hyperledger/fabric organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp | tar zxf - -C build/msp
  kubectl -n $NS exec deploy/org2-ca -- tar zcf - -C /var/hyperledger/fabric organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp | tar zxf - -C build/msp
}

function app_one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
  local ORG=$1
  local PP=$(one_line_pem $2)
  local CP=$(one_line_pem $3)
  sed -e "s/\${ORG}/$ORG/" \
      -e "s#\${PEERPEM}#$PP#" \
      -e "s#\${CAPEM}#$CP#" \
      scripts/ccp-template.json
}

function app_id {
  local MSP=$1
  local CERT=$(one_line_pem $2)
  local PK=$(one_line_pem $3)

  sed -e "s#\${CERTIFICATE}#$CERT#" \
      -e "s#\${PRIVATE_KEY}#$PK#" \
      -e "s#\${MSPID}#$MSP#" \
      scripts/appuser.id.template
}

function construct_application_configmap() {
  push_fn "Constructing application connection profiles"

  app_extract_MSP_archives

  mkdir -p build/application/wallet
  mkdir -p build/application/gateway
  
  local peer_pem=build/msp/organizations/peerOrganizations/org1.example.com/msp/tlscacerts/org1-tls-ca.pem
  local ca_pem=build/msp/organizations/peerOrganizations/org1.example.com/msp/cacerts/org1-ca.pem

  echo "$(json_ccp 1 $peer_pem $ca_pem)" > build/application/gateway/org1_ccp.json
  
#  peer_pem=build/msp/organizations/peerOrganizations/org2.example.com/msp/tlscacerts/org2-tls-ca.pem
#  ca_pem=build/msp/organizations/peerOrganizations/org2.example.com/msp/cacerts/org2-ca.pem
#
#  echo "$(json_ccp 2 $peer_pem $ca_pem)" > build/application/gateways/org2_ccp.json

  pop_fn

  push_fn "Getting Application Identities"

  local cert=build/msp/organizations/peerOrganizations/org1.example.com/users/Admin\@org1.example.com/msp/signcerts/cert.pem
  local pk=build/msp/organizations/peerOrganizations/org1.example.com/users/Admin\@org1.example.com/msp/keystore/server.key

  echo "$(app_id Org1MSP $cert $pk)" > build/application/wallet/org1-admin.id

#  local cert=build/msp/organizations/peerOrganizations/org2.example.com/users/Admin\@org2.example.com/msp/signcerts/cert.pem
#  local pk=build/msp/organizations/peerOrganizations/org2.example.com/users/Admin\@org2.example.com/msp/keystore/server.key
#
#  echo "$(app_id Org2MSP $cert $pk)" > build/application/wallet/appuser_org2.id

  pop_fn

  push_fn "Creating ConfigMap \"app-fabric-tls-v1-map\" with TLS certificates for the application"
  kubectl -n $NS delete configmap app-fabric-tls-v1-map || true
  kubectl -n $NS create configmap app-fabric-tls-v1-map --from-file=./build/msp/organizations/peerOrganizations/org1.example.com/msp/tlscacerts
  pop_fn

  push_fn "Creating ConfigMap \"app-fabric-ids-v1-map\" with identities for the application"
  kubectl -n $NS delete configmap app-fabric-ids-v1-map || true
  kubectl -n $NS create configmap app-fabric-ids-v1-map --from-file=./build/application/wallet
  pop_fn

  push_fn "Creating ConfigMap \"app-fabric-ccp-v1-map\" with ConnectionProfile for the application"
  kubectl -n $NS delete configmap app-fabric-ccp-v1-map || true
  kubectl -n $NS create configmap app-fabric-ccp-v1-map --from-file=./build/application/gateway
  pop_fn

  push_fn "Creating ConfigMap \"app-fabric-org1-cacerts-v1-map\" with org1 cacert"
  kubectl -n $NS delete configmap app-fabric-org1-cacerts-v1-map || true
  kubectl -n $NS create configmap app-fabric-org1-cacerts-v1-map --from-file=./build/msp/organizations/peerOrganizations/org1.example.com/msp/cacerts
  pop_fn

#  push_fn "Creating ConfigMap \"app-fabric-org2-cacerts-v1-map\" with org2 cacert"
#  kubectl -n $NS delete configmap app-fabric-org2-cacerts-v1-map || true
#  kubectl -n $NS create configmap app-fabric-org2-cacerts-v1-map --from-file=./build/msp/organizations/peerOrganizations/org2.example.com/msp/cacerts
#  pop_fn

  push_fn "Creating ConfigMap \"app-fabric-org1-v1-map\" with Organization 1 information for the application"

cat <<EOF > build/app-fabric-org1-v1-map.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-fabric-org1-v1-map
data:
  fabric_channel: ${CHANNEL_NAME}
  fabric_contract: ${CHAINCODE_NAME}
  fabric_wallet_dir: /fabric/application/wallet
  fabric_gateway_dir: /fabric/application/gateway
  fabric_ccp_name: org1_ccp.json
  fabric_app_admin: org1-admin
  fabric_app_pass: adminpw
  fabric_gateway_tlsCertPath: /fabric/tlscacerts/org1-tls-ca.pem
  fabric_ca_cert: /fabric/cacerts/org1-ca.pem
  ca_host_name: org1-ca
  org: Org1
  mspid: Org1MSP
EOF

  kubectl -n $NS apply -f build/app-fabric-org1-v1-map.yaml

  # todo: could add the second org here

  pop_fn

}

function deploy_application() {
  local app_image=$1
  local redis_image=$2
  local mongo_image=$3
  push_fn "Launching application container \"${app_image}\""

  cat kube/application-deployment.yaml \
    | sed 's,{{APP_IMAGE}},'${app_image}',g' \
    | sed 's,{{REDIS_IMAGE}},'${redis_image}',g' \
    | sed 's,{{MONGO_IMAGE}},'${mongo_image}',g' \
    | sed 's,{{APP_STORE_PVC}},fabric-org1 ,g' \
    | exec kubectl -n $NS apply -f -

  kubectl -n $NS rollout status deploy/application-deployment

  pop_fn
}


function application_connection() {
  construct_application_configmap
  deploy_application ${LOCAL_REGISTRY_HOST}:${LOCAL_REGISTRY_PORT}/${APP_IMAGE} ${REDIS_IMAGE} ${MONGO_IMAGE}
}