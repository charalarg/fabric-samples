import * as config from './config/config';
import express from 'express';
import { logger, loggerMiddleware } from './utilities/logger';
import { validateJson } from './middlewares/validate';
import fileUpload from 'express-fileupload';
import passport from 'passport';
import { fabricAPIKeyStrategy } from './middlewares/auth';
import { internalServerError, notFoundError } from './middlewares/error';
import Routes from './routers/index.router';
import Redis from './services/redis.service';
import helmet from 'helmet';
import Mongo from './services/mongo.service';
import UserModel, { Role } from './models/user.model';
import cors from 'cors';

class App {
  public app: express.Application;
  public port: string | number;

  constructor() {
    this.app = express();
    this.port = config.port || 5000;

    try {
      this.initializeMiddlewares();
      this.initializeRoutes();

      // this.initializeSwagger();
    } catch (err) {
      console.log(err);
    }
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  public async init() {
    await App.initDB();
    Redis.getInstance();
  }

  private static async initDB() {
    await Mongo.getInstance();
    await UserModel.createUser(config.fabricAppAdmin, config.fabricAppPass, Role.OrgAdmin);
  }

  private initializeRoutes() {
    this.app.use('/', new Routes().router);
  }

  private initializeMiddlewares() {
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(loggerMiddleware);
    this.app.use(express.json({ verify: validateJson }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(fileUpload({ limits: { fileSize: config.maxFileSize } }));
    passport.use(fabricAPIKeyStrategy);
    this.app.use(passport.initialize());
    this.app.use(passport.session());
    this.app.use(notFoundError);
    this.app.use(internalServerError);
  }
  // private initializeSwagger() {
  //   const options = {
  //     swaggerDefinition: {
  //       info: {
  //         title: 'REST API',
  //         version: '1.0.0',
  //         description: 'Example docs',
  //       },
  //     },
  //     apis: ['swagger.yaml'],
  //   };
  //
  //   const specs = swaggerJSDoc(options);
  //   this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  // }
}

export default App;
