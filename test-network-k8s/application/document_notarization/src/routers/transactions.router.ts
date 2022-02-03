/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { authenticateApiKey } from '../middlewares/auth';
import TransactionsController from '../controllers/transactions.controller';

class TransactionsRouter {
  public path = '/';
  public router = express.Router();
  public transactionsController = new TransactionsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      this.path + ':transactionId',
      authenticateApiKey,
      this.transactionsController.getTransaction
    );
  }
}

export default TransactionsRouter;
