import * as config from '../config/config';
import { connect, disconnect } from 'mongoose';

class Mongo {
  private static _instance: Mongo;
  private readonly connectionString: string;

  constructor() {
    this.connectionString =
      'mongodb://' +
      config.mongoDbUsername +
      ':' +
      config.mongoDbPassword +
      '@' +
      config.mongoDbHost +
      ':' +
      config.mongoDbPort +
      '/' +
      config.mongoDbName;
  }

  private async init() {
    await connect(this.connectionString);
  }

  public cleanUp = async (): Promise<void> => {
    Mongo._instance = {} as Mongo;
  };

  static async getInstance() {
    if (this._instance) {
      return this._instance;
    }

    this._instance = new Mongo();
    await this._instance.init();
    return this._instance;
  }
}

export default Mongo;
