/*
 * SPDX-License-Identifier: Apache-2.0
 */

import Fabric from './fabric.service';
import FabricCAServices from 'fabric-ca-client';
import * as config from '../config/config';
import { logger } from '../utilities/logger';
import { X509Identity } from 'fabric-network';

class FabricAdmin extends Fabric {
  constructor() {
    super();
  }

  private buildCaClient = (ccp: Record<string, unknown>): FabricCAServices => {
    const ca = ccp.certificateAuthorities as Record<string, unknown>;
    const caInfo = ca[config.caHostName] as Record<string, unknown>;
    const caUrl = caInfo.url as string;
    const caName = caInfo.caName as string;
    const caTlsInfo = caInfo.tlsCACerts as Record<string, unknown>;
    const caTLSCACerts = caTlsInfo.pem as string[];
    const httpOptions = caInfo.httpOptions as Record<string, unknown>;
    const verify = httpOptions.verify as boolean;
    return new FabricCAServices(caUrl, { trustedRoots: caTLSCACerts, verify: verify }, caName);
  };

  public registerAndEnrollUser = async (userId: string): Promise<void> => {
    const adminIdentity = this.userIdentity as X509Identity;
    const adminId = this.userId as string;

    try {
      const wallet = await this.loadWallet();
      const caClient = this.buildCaClient(this.ccp);
      const userIdentity = await wallet.get(userId);
      if (userIdentity) {
        logger.info(`An identity for the user ${userId} already exists in the wallet`);
        return;
      }

      const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
      const adminUser = await provider.getUserContext(adminIdentity, adminId);

      const secret = await caClient.register(
        {
          affiliation: '',
          enrollmentID: userId,
          role: 'client',
        },
        adminUser
      );
      const enrollment = await caClient.enroll({
        enrollmentID: userId,
        enrollmentSecret: secret,
      });
      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: config.mspid,
        type: 'X.509',
      };
      await wallet.put(userId, x509Identity);
    } catch (error) {
      logger.error(`Failed to register user : ${error}`);
    }
  };
}

export default FabricAdmin;
