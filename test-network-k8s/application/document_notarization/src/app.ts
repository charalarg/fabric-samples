import * as config from './config/config';
import express from 'express';
import helmet from 'helmet';
import { loggerMiddleware } from './utilities/logger';
import { validateJson } from './middlewares/validate';
import fileUpload from 'express-fileupload';
import passport from 'passport';
import { authenticateApiKey, fabricAPIKeyStrategy } from './middlewares/auth';
import { internalServerError, notFoundError } from './middlewares/error';
import { healthRouter } from './routers/health.router';
import { usersRouter } from './routers/users.router';
import { jobsRouter } from './routers/jobs.router';
import { documentsRouter } from './routers/documents.router';
import { transactionsRouter } from './routers/transactions.router';
import { logger } from './utilities/logger';
import { loadContracts } from './services/fabric.service';
import { cleanUp, initJobs } from './services/jobs.service';

class App {
  public app: express.Application;
  public port: string | number;

  constructor() {
    this.app = express();
    this.port = config.port || 5000;

    try {
      // Init app
      this.initializeMiddlewares();
      this.initializeRoutes();
      this.initAsyncTasks();

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

  private async initAsyncTasks() {
    await this.initDB();
    await this.initializeContracts();
    await this.initializeJobs();
  }

  private async initDB() {
    try {
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  }

  private initializeRoutes() {
    this.app.use('/', healthRouter);
    this.app.use('/api/users', usersRouter);
    this.app.use('/api/jobs', authenticateApiKey, jobsRouter);
    this.app.use('/api/documents', authenticateApiKey, documentsRouter);
    this.app.use('/api/transactions', authenticateApiKey, transactionsRouter);
  }

  private initializeMiddlewares() {
    this.app.use(loggerMiddleware);
    this.app.use(express.json({ verify: validateJson }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(fileUpload({ limits: { fileSize: config.maxFileSize } }));
    passport.use(fabricAPIKeyStrategy);
    this.app.use(passport.initialize());
    this.app.use(helmet());
    this.app.use(notFoundError);
    this.app.use(internalServerError);
  }

  private async initializeContracts() {
    this.app.locals[config.MSPID] = await loadContracts();
    logger.info('------------' + this.app.locals[config.MSPID].docNotarizationContract);
  }

  private async initializeJobs() {
    this.app.locals.jobq = await initJobs(this.app.locals[config.MSPID]?.docNotarizationContract);
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

process.on('uncaughtException', async function (exception) {
  console.log(exception);
  await cleanUp();
});

export default App;
