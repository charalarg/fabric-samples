/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Contract,
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  Gateway,
  GatewayOptions,
  Wallets,
  Network,
  Transaction,
  Wallet,
  Identity,
} from 'fabric-network';
import * as config from './config';
import { logger } from './logger';
import { handleError } from './errors';
import * as protos from 'fabric-protos';
import yaml from 'js-yaml';
import fs from 'fs';
// import { FabricCAServices } from 'fabric-ca-client';

export const loadUserIdentity = async (user: string): Promise<Identity | undefined> => {
  const userWallet = await Wallets.newFileSystemWallet(config.fabricWalletDir);
  const userIdentity = await userWallet.get(user);
  if (!userIdentity) {
    logger.info(`An identity for the user ${user} does not exists in the wallet`);
    return;
  }
  return userIdentity;
};

export const loadUserIdentityFromFS = async (user: string): Promise<Record<string, unknown> | undefined> => {
  const userIdentity = (await yaml.load(
    fs.readFileSync(config.fabricWalletDir + '/' + user + '.id', 'utf8')
  )) as Record<string, unknown>;

  if (!userIdentity) {
    logger.info(`An identity for the user ${user} does not exists in the wallet`);
    return;
  }
  return userIdentity;
};

export const loadUserWallet = async (): Promise<Wallet> => {
  const userWallet = await Wallets.newFileSystemWallet(config.fabricWalletDir);
  return userWallet;
};

// export const buildCaClient = (ccp: Record<string, unknown>): FabricCAServices => {
//   const ca = ccp.certificateAuthorities as Record<string, unknown>;
//   const caInfo = ca[config.caHostName] as Record<string, unknown>;
//   const caTlsInfo = ca.tlsCACerts as Record<string, unknown>;
//   const caTLSCACerts = caTlsInfo.pem;
//   const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: true }, caInfo.caName);
//   return caClient;
// };

export const buildCCP = (): Record<string, unknown> => {
  return yaml.load(fs.readFileSync(config.fabricGatewayDir + '/' + config.fabric_ccp_name, 'utf8')) as Record<
    string,
    unknown
  >;
};

// export const registerAndEnrollUser = async (userId: string): Promise<void> => {
//   try {
//     const wallet = await loadUserWallet();
//     const ccp = buildCCP();
//     const caClient = buildCaClient(ccp);
//     const userIdentity = await wallet.get(userId);
//     if (userIdentity) {
//       logger.info(`An identity for the user ${userId} already exists in the wallet`);
//       return;
//     }
//
//     const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
//     const adminUser = await provider.getUserContext(adminIdentity, adminUserId);
//
//     const secret = await caClient.register(
//       {
//         affiliation: '',
//         enrollmentID: userId,
//         role: 'client',
//       },
//       adminUser
//     );
//     const enrollment = await caClient.enroll({
//       enrollmentID: userId,
//       enrollmentSecret: secret,
//     });
//     const x509Identity = {
//       credentials: {
//         certificate: enrollment.certificate,
//         privateKey: enrollment.key.toBytes(),
//       },
//       mspId: config.MSPID,
//       type: 'X.509',
//     };
//     await wallet.put(userId, x509Identity);
//   } catch (error) {
//     logger.error(`Failed to register user : ${error}`);
//   }
// };

/*
 * Create a Gateway connection
 *
 * Gateway instances can and should be reused rather than connecting to submit every transaction
 */
export const createGateway = async (
  connectionProfile: Record<string, unknown>,
  identity: string,
  wallet: Wallet
): Promise<Gateway> => {
  logger.debug({ connectionProfile, identity }, 'Configuring gateway');

  const gateway = new Gateway();

  const options: GatewayOptions = {
    wallet,
    identity,
    discovery: { enabled: true, asLocalhost: false },
    eventHandlerOptions: {
      commitTimeout: config.commitTimeout,
      endorseTimeout: config.endorseTimeout,
      strategy: DefaultEventHandlerStrategies.PREFER_MSPID_SCOPE_ANYFORTX,
    },
    queryHandlerOptions: {
      timeout: config.queryTimeout,
      strategy: DefaultQueryHandlerStrategies.PREFER_MSPID_SCOPE_ROUND_ROBIN,
    },
  };

  await gateway.connect(connectionProfile, options);

  return gateway;
};

/*
 * Get the network which the asset transfer sample chaincode is running on
 *
 * In addion to getting the contract, the network will also be used to
 * start a block event listener
 */
export const getNetwork = async (gateway: Gateway): Promise<Network> => {
  const network = await gateway.getNetwork(config.channelName);
  return network;
};

/*
 * Get the asset transfer sample contract and the qscc system contract
 *
 * The system contract is used for the liveness REST endpoint
 */
export const getContracts = async (
  network: Network
): Promise<{ docNotarizationContract: Contract; qsccContract: Contract }> => {
  const docNotarizationContract = network.getContract(config.chaincodeName);
  const qsccContract = network.getContract('qscc');
  return { docNotarizationContract, qsccContract };
};

/*
 * Evaluate a transaction and handle any errors
 */
export const evatuateTransaction = async (
  contract: Contract,
  transactionName: string,
  ...transactionArgs: string[]
): Promise<Buffer> => {
  const transaction = contract.createTransaction(transactionName);
  const transactionId = transaction.getTransactionId();
  logger.trace({ transaction }, 'Evaluating transaction');

  try {
    const payload = await transaction.evaluate(...transactionArgs);
    logger.trace(
      { transactionId: transactionId, payload: payload.toString() },
      'Evaluate transaction response received'
    );
    return payload;
  } catch (err) {
    throw handleError(transactionId, err);
  }
};

/*
 * Submit a transaction and handle any errors
 */
export const submitTransaction = async (
  transaction: Transaction,
  ...transactionArgs: string[]
): Promise<Buffer> => {
  logger.trace({ transaction }, 'Submitting transaction');
  const txnId = transaction.getTransactionId();

  try {
    const payload = await transaction.submit(...transactionArgs);
    logger.trace({ transactionId: txnId, payload: payload.toString() }, 'Submit transaction response received');
    return payload;
  } catch (err) {
    throw handleError(txnId, err);
  }
};

/*
 * Get the validation code of the specified transaction
 */
export const getTransactionValidationCode = async (
  qsccContract: Contract,
  transactionId: string
): Promise<string> => {
  const data = await evatuateTransaction(qsccContract, 'GetTransactionByID', config.channelName, transactionId);

  const processedTransaction = protos.protos.ProcessedTransaction.decode(data);
  const validationCode = protos.protos.TxValidationCode[processedTransaction.validationCode];

  logger.debug({ transactionId }, 'Validation code: %s', validationCode);
  return validationCode;
};

/*
 * Get the current block height
 *
 * This example of using a system contract is used for the liveness REST
 * endpoint
 */
export const getBlockHeight = async (qscc: Contract): Promise<number | Long.Long> => {
  const data = await qscc.evaluateTransaction('GetChainInfo', config.channelName);
  const info = protos.common.BlockchainInfo.decode(data);
  const blockHeight = info.height;

  logger.debug('Current block height: %d', blockHeight);
  return blockHeight;
};
