/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import HealthController from '../controllers/health.controller';

class HealthRouter {
  public path = '/';
  public router = express.Router();
  public healthController = new HealthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(this.path + 'ready', this.healthController.isReady);
    this.router.get(this.path + 'live', this.healthController.isLive);
  }
}

export default HealthRouter;
