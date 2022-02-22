/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Contract,
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  Gateway,
  GatewayOptions,
  Network,
  Transaction,
  Wallet,
  Wallets,
} from 'fabric-network';
import * as config from '../config/config';
import { logger } from '../utilities/logger';
import { handleError } from '../utilities/errors';
import * as protos from 'fabric-protos';
import yaml from 'js-yaml';
import * as fs from 'fs';

class Fabric {
  private walletDir: Wallet | undefined;
  private ccp: Record<string, unknown>;
  public contracts: Record<string, unknown>;

  constructor() {
    this.walletDir = undefined;
    this.ccp = {};
    this.contracts = {};
  }

  public async init(userId: string) {
    this.walletDir = await this.loadWallet();
    this.ccp = yaml.load(
      fs.readFileSync(config.fabricGatewayDir + '/' + config.fabric_ccp_name, 'utf8')
    ) as Record<string, unknown>;
    this.contracts = await this.loadContracts(userId);
  }

  public loadWallet = async (): Promise<Wallet> => {
    return await Wallets.newFileSystemWallet(config.fabricWalletDir);
  };

  public loadContracts = async (
    userId: string
  ): Promise<{
    docNotarizationContract: Contract;
    qsccContract: Contract;
  }> => {
    const gateteway = await this.createGateway(userId);
    const network = await this.getNetwork(gateteway);
    const docNotarizationContract = network.getContract(config.chaincodeName);
    const qsccContract = network.getContract('qscc');
    return { docNotarizationContract, qsccContract };
  };

  private createGateway = async (identity: string): Promise<Gateway> => {
    const gateway = new Gateway();
    const options: GatewayOptions = {
      identity,
      wallet: this.walletDir,
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

    await gateway.connect(this.ccp, options);
    return gateway;
  };

  private getNetwork = async (gateway: Gateway): Promise<Network> => {
    return await gateway.getNetwork(config.channelName);
  };

  public evaluateTransaction = async (
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

  public submitTransaction = async (transaction: Transaction, ...transactionArgs: string[]): Promise<Buffer> => {
    logger.trace({ transaction }, 'Submitting transaction');
    const txnId = transaction.getTransactionId();

    try {
      const payload = await transaction.submit(...transactionArgs);
      logger.trace(
        { transactionId: txnId, payload: payload.toString() },
        'Submit transaction response received'
      );
      return payload;
    } catch (err) {
      throw handleError(txnId, err);
    }
  };

  public getTransactionValidationCode = async (
    qsccContract: Contract,
    transactionId: string
  ): Promise<string> => {
    const data = await this.evaluateTransaction(
      qsccContract,
      'GetTransactionByID',
      config.channelName,
      transactionId
    );

    const processedTransaction = protos.protos.ProcessedTransaction.decode(data);
    const validationCode = protos.protos.TxValidationCode[processedTransaction.validationCode];

    logger.debug({ transactionId }, 'Validation code: %s', validationCode);
    return validationCode;
  };

  public getBlockHeight = async (qscc: Contract): Promise<number | Long.Long> => {
    const data = await qscc.evaluateTransaction('GetChainInfo', config.channelName);
    const info = protos.common.BlockchainInfo.decode(data);
    const blockHeight = info.height;

    logger.debug('Current block height: %d', blockHeight);
    return blockHeight;
  };
}

export default Fabric;

// export const buildCaClient = (ccp: Record<string, unknown>): FabricCAServices => {
//   const ca = ccp.certificateAuthorities as Record<string, unknown>;
//   const caInfo = ca[config.caHostName] as Record<string, unknown>;
//   const caTlsInfo = ca.tlsCACerts as Record<string, unknown>;
//   const caTLSCACerts = caTlsInfo.pem;
//   const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: true }, caInfo.caName);
//   return caClient;
// };

// export const buildCCP = (): Record<string, unknown> => {
//   return yaml.load(fs.readFileSync(config.fabricGatewayDir + '/' + config.fabric_ccp_name, 'utf8')) as Record<
//     string,
//     unknown
//   >;
// };

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
//       mspId: config.mspid,
//       type: 'X.509',
//     };
//     await wallet.put(userId, x509Identity);
//   } catch (error) {
//     logger.error(`Failed to register user : ${error}`);
//   }
// };
