import express from 'express';
import { body } from 'express-validator';
import { validateStructure } from '../middlewares/validate';
import { allowRoles, authenticateApiKey, publicFacing } from '../middlewares/auth';
import DocumentsController from '../controllers/documents.controller';
import { Role } from '../models/user.model';

class DocumentsRouter {
  public path = '/';
  public router = express.Router();
  public documentsController = new DocumentsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      this.path,
      authenticateApiKey,
      allowRoles([Role.Admin]),
      body().isObject().withMessage('body must contain an document object'),
      body('clientId', 'must be a string').notEmpty(),
      body('title', 'must be a string').notEmpty(),
      body('expires', 'must be yyyy-mm-dd format').notEmpty().isISO8601().toDate(),
      validateStructure,
      this.documentsController.createDocument
    );

    this.router.post(
      this.path + 'validate',
      publicFacing(),
      body().isObject().withMessage('body must contain an document object'),
      validateStructure,
      this.documentsController.validateDocument
    );

    this.router.get(
      this.path + ':client?',
      authenticateApiKey,
      allowRoles([Role.Admin, Role.User]),
      this.documentsController.getDocuments
    );
  }
}

export default DocumentsRouter;
