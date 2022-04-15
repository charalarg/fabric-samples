#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

function app_one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function app_json_ccp {
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

  ENROLLMENT_DIR=${TEMP_DIR}/enrollments
  CHANNEL_MSP_DIR=${TEMP_DIR}/channel-msp

  mkdir -p build/application/wallet
  mkdir -p build/application/gateway

  local peer_pem=$CHANNEL_MSP_DIR/peerOrganizations/org1/msp/tlscacerts/tlsca-signcert.pem
  local ca_pem=$CHANNEL_MSP_DIR/peerOrganizations/org1/msp/cacerts/ca-signcert.pem

  echo "$(json_ccp 1 $peer_pem $ca_pem)" > build/application/gateway/org1_ccp.json

  pop_fn

  push_fn "Getting Application Identities"

  local cert=$ENROLLMENT_DIR/org1/users/org1admin/msp/signcerts/cert.pem
  local pk=$ENROLLMENT_DIR/org1/users/org1admin/msp/keystore/key.pem

  echo "$(app_id Org1MSP $cert $pk)" > build/application/wallet/org1-admin.id

  pop_fn

  push_fn "Creating ConfigMap \"app-fabric-tls-v1-map\" with TLS certificates for the application"
  kubectl -n $NS delete configmap app-fabric-tls-v1-map || true
  kubectl -n $NS create configmap app-fabric-tls-v1-map --from-file=$CHANNEL_MSP_DIR/peerOrganizations/org1/msp/tlscacerts
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
  kubectl -n $NS create configmap app-fabric-org1-cacerts-v1-map --from-file=$CHANNEL_MSP_DIR/peerOrganizations/org1/msp/cacerts
  pop_fn


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
  fabric_ca_cert: /fabric/cacerts/ca-signcert.pem
  fabric_gateway_tlsCertPath: /fabric/tlscacerts/tlsca-signcert.pem
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
  local frontend_image=$2
  local redis_image=$3
  local mongo_image=$4
  push_fn "Launching application containers"

  cat kube/application-deployment.yaml \
    | sed 's,{{APP_IMAGE}},'${app_image}',g' \
    | sed 's,{{FRONTEND_IMAGE}},'${frontend_image}',g' \
    | sed 's,{{REDIS_IMAGE}},'${redis_image}',g' \
    | sed 's,{{MONGO_IMAGE}},'${mongo_image}',g' \
    | sed 's,{{APP_STORE_PVC}},fabric-org1-app ,g' \
    | exec kubectl -n $NS apply -f -

  kubectl -n $NS rollout status deploy/application-deployment

  pop_fn
}


function application_connection() {
  kubectl -n $NS delete deploy/application-deployment --ignore-not-found=true
  kubectl create -f kube/pv-fabric-org1-app.yaml || true
  kubectl -n $NS create -f kube/pvc-fabric-org1-app.yaml || true
  construct_application_configmap
  deploy_application ${LOCAL_REGISTRY_HOST}:${LOCAL_REGISTRY_PORT}/${APP_IMAGE} ${LOCAL_REGISTRY_HOST}:${LOCAL_REGISTRY_PORT}/${FRONTEND_IMAGE} ${REDIS_IMAGE} ${MONGO_IMAGE}
}