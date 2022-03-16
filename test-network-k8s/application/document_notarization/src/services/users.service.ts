import { Wallets, X509Identity } from 'fabric-network';
import * as config from '../config/config';
import yaml from 'js-yaml';
import fs from 'fs';
import Fabric from './fabric.service';
import Redis from './redis.service';
import { Role } from '../models/user.model';

class User {
  public userId: string;
  public mspId: string;
  public role: Role;
  public fabricSvc: Fabric;

  constructor(userId: string, mspId: string, role: Role) {
    this.userId = userId;
    this.mspId = mspId;
    this.role = role;
    this.fabricSvc = new Fabric();
  }

  public async init() {
    await this.fabricSvc.init(this.userId);
    await Redis.getInstance().initJobQueueWorker(this.fabricSvc);
  }

  private loadUserIdentity = async (): Promise<X509Identity | undefined> => {
    const userWallet = await Wallets.newFileSystemWallet(config.fabricWalletDir);
    return (await userWallet.get(this.userId)) as X509Identity;
  };

  public loadUserCredentials = async (): Promise<Record<string, unknown>> => {
    const userIdentity = await this.loadUserIdentity();
    return (userIdentity as X509Identity).credentials as Record<string, unknown>;
  };

  public loadUserIdentityFromFS = async (): Promise<X509Identity> => {
    return (await yaml.load(
      fs.readFileSync(config.fabricWalletDir + '/' + this.userId + '.id', 'utf8')
    )) as X509Identity;
  };
}

export default User;
