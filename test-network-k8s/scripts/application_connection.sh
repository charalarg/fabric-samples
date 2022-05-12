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
  mkdir -p build/application/gateways

  local peer_pem=$CHANNEL_MSP_DIR/peerOrganizations/org1/msp/tlscacerts/tlsca-signcert.pem
  local ca_pem=$CHANNEL_MSP_DIR/peerOrganizations/org1/msp/cacerts/ca-signcert.pem

  echo "$(json_ccp 1 $peer_pem $ca_pem)" > build/application/gateways/org1_ccp.json

#  peer_pem=$CHANNEL_MSP_DIR/peerOrganizations/org2/msp/tlscacerts/tlsca-signcert.pem
#  ca_pem=$CHANNEL_MSP_DIR/peerOrganizations/org2/msp/cacerts/ca-signcert.pem
#
#  echo "$(json_ccp 2 $peer_pem $ca_pem)" > build/application/gateways/org2_ccp.json

  pop_fn

  push_fn "Getting Application Identities"

  local cert=$ENROLLMENT_DIR/org1/users/org1admin/msp/signcerts/cert.pem
  local pk=$ENROLLMENT_DIR/org1/users/org1admin/msp/keystore/key.pem

  echo "$(app_id Org1MSP $cert $pk)" > build/application/wallet/org1-admin.id

#  local cert=$ENROLLMENT_DIR/org2/users/org2admin/msp/signcerts/cert.pem
#  local pk=$ENROLLMENT_DIR/org2/users/org2admin/msp/keystore/key.pem
#
#  echo "$(app_id Org2MSP $cert $pk)" > build/application/wallet/appuser_org2.id

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
  kubectl -n $NS create configmap app-fabric-ccp-v1-map --from-file=./build/application/gateways
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
  fabric_contract: document-notarization
  fabric_wallet_dir: /fabric/application/wallet
  fabric_gateway_dir: /fabric/application/gateways
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

function set_application_images() {
  local app_folder=$1
  local frontend_folder=$2

  if [ -z "APPLICATION_IMAGE" ]; then
    # app_folder and frontend_folder path starting with first index of "fabric-samples"
    APPLICATION_IMAGE=${app_folder/*fabric-samples/fabric-samples}
    FRONTEND_IMAGE=${frontend_folder/*fabric-samples/fabric-samples}
  else
    APPLICATION_IMAGE=${APPLICATION_IMAGE}
    FRONTEND_IMAGE=${FRONTEND_IMAGE}
  fi
}

function build_application_images() {
  local app_folder=$1
  local frontend_folder=$2
  local app_image=$3
  local frontend_image=$4

  push_fn "Building application images ${app_image}, ${frontend_image}"

  $CONTAINER_CLI build ${CONTAINER_NAMESPACE} -f ${app_folder}/DockerfileDev -t ${app_image} ${app_folder}
  $CONTAINER_CLI build ${CONTAINER_NAMESPACE} -t ${frontend_image} ${frontend_folder}

  pop_fn
}

function kind_load_images() {
  local app_image=$1
  local frontend_image=$2

  push_fn "Loading application images to kind image plane"

  kind load docker-image ${app_image}
  kind load docker-image ${frontend_image}

  pop_fn
}

function launch_application_service() {
  local app_image=$1
  local frontend_image=$2
  push_fn "Launching application container \"${app_image}\""

  cat kube/application-deployment.yaml \
    | sed 's,{{APP_IMAGE}},'${app_image}',g' \
    | sed 's,{{FRONTEND_IMAGE}},'${frontend_image}',g' \
    | exec kubectl -n $NS apply -f -

  kubectl -n $NS rollout status deploy/application-deployment

  pop_fn
}

function deploy_application() {
  local app_folder=$(absolute_path $1)
  local frontend_folder=$(absolute_path $2)

  kubectl -n $NS delete deploy/application-deployment --ignore-not-found=true
  construct_application_configmap

  set_application_images     ${app_folder} ${frontend_folder}
  build_application_images   ${app_folder} ${frontend_folder} ${APPLICATION_IMAGE} ${FRONTEND_IMAGE}
  if [ "${CLUSTER_RUNTIME}" == "kind" ]; then
    kind_load_images         ${APPLICATION_IMAGE} ${FRONTEND_IMAGE}
  fi

  launch_application_service ${APPLICATION_IMAGE} ${FRONTEND_IMAGE}

#log
# log "For k8s applications:"
# log "Config Maps created for the application"
# log "To deploy your application updated the image name and issue these commands"
# log ""
# log "kubectl -n $NS apply -f kube/application-deployment.yaml"
# log "kubectl -n $NS rollout status deploy/application-deployment"
# log
# log "For non-k8s applications:"
# log "ConnectionPrfiles are in ${PWD}/build/application/gateways"
# log "Identities are in  ${PWD}/build/application/wallets"
# log
}