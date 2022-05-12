import { Wallets, X509Identity } from 'fabric-network';
import * as config from '../config/config';
import Fabric from './fabric.service';
import Redis from './redis.service';
import { Role } from '../models/user.model';
import FabricAdmin from './fabricAdmin.service';

class User {
  public userId: string;
  public mspId: string;
  public role: Role;
  public fabricSvc!: FabricAdmin;
  fabricSvcMap = { OrgAdmin: FabricAdmin, Admin: FabricAdmin, User: Fabric };

  private constructor(userId: string, mspId: string, role: Role) {
    this.userId = userId;
    this.mspId = mspId;
    this.role = role;
  }

  public static async build(userId: string, mspId: string, role: Role) {
    const user = new User(userId, mspId, role);
    await user.init();
    return user;
  }

  public async init() {
    const userIdentity = (await this.loadUserIdentity()) as X509Identity;
    const fabricClass = this.fabricSvcMap[Role.OrgAdmin];
    this.fabricSvc = await fabricClass.build(fabricClass, this.userId, userIdentity);
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
}

export default User;
