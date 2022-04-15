import { Router } from 'express';
import HealthRouter from './health.router';
import JobsRouter from './jobs.router';
import UsersRouter from './users.router';
import DocumentsRouter from './documents.router';
import TransactionsRouter from './transactions.router';

class Routes {
  // public path = '/api';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // App routes
    this.router.use('', new HealthRouter().router);
    this.router.use('/users', new UsersRouter().router);
    this.router.use('/jobs', new JobsRouter().router);
    this.router.use('/documents', new DocumentsRouter().router);
    this.router.use('/transactions', new TransactionsRouter().router);
  }
}

export default Routes;
