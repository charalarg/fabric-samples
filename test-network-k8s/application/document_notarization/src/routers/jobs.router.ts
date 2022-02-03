/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { authenticateApiKey } from '../middlewares/auth';
import JobsController from '../controllers/jobs.controller';

class JobsRouter {
  public path = '/';
  public router = express.Router();
  public jobsController = new JobsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(this.path + ':jobId', authenticateApiKey, this.jobsController.getJob);
  }
}

export default JobsRouter;
