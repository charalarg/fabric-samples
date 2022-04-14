import express from 'express';
import UsersController from '../controllers/users.controller';
import { body } from 'express-validator';
import { validateStructure } from '../middlewares/validate';
import { Gender, Role } from '../models/user.model';
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
      this.usersController.registerUser
    );

    this.router.post(
      this.path + 'registerClient',
      authenticateApiKey,
      allowRoles([Role.Admin]),
      body().isObject({ strict: true }),
      body('userId', 'must be a string').notEmpty(),
      body('password', 'must be a string').notEmpty(),
      body('name', 'must be a string').notEmpty(),
      body('surname', 'must be a string').notEmpty(),
      body('nationalId', 'must be a string').notEmpty(),
      body('dateOfBirth', 'must be yyyy-mm-dd format').notEmpty().isISO8601().toDate(),
      body('gender', 'must be Male, Female, or Other').notEmpty().isIn(Object.values(Gender)),
      validateStructure,
      this.usersController.registerUser
    );

    this.router.get(this.path, authenticateApiKey, allowRoles([Role.Admin]), this.usersController.getUsers);
  }
}

export default UsersRouter;
