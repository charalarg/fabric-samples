import express from 'express';
import UsersController from '../controllers/users.controller';
import { body } from 'express-validator';
import { validateStructure } from '../middlewares/validate';
import { Role } from '../models/user.model';
import { allowRoles, authenticateApiKey } from '../middlewares/auth';

class UsersRouter {
  public path = '/';
  public router = express.Router();
  public usersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      this.path + 'login',
      body().isObject({ strict: true }),
      body('userId', 'must be a string').notEmpty(),
      body('password', 'must be a string').notEmpty(),
      validateStructure,
      this.usersController.login
    );

    this.router.post(
      this.path + 'registerAdmin',
      authenticateApiKey,
      allowRoles([Role.OrgAdmin]),
      body().isObject({ strict: true }),
      body('userId', 'must be a string').notEmpty(),
      body('password', 'must be a string').notEmpty(),
      validateStructure,
      this.usersController.registerAdmin
    );
  }
}

export default UsersRouter;
