import express from 'express';
import { body } from 'express-validator';
import { validateStructure } from '../middlewares/validate';
import { allowRoles, authenticateApiKey } from '../middlewares/auth';
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
      allowRoles([Role.OrgAdmin]),
      body().isObject().withMessage('body must contain an document object'),
      validateStructure,
      this.documentsController.createDocument
    );

    this.router.post(
      this.path + 'validate',
      authenticateApiKey,
      body().isObject().withMessage('body must contain an document object'),
      validateStructure,
      this.documentsController.validateDocument
    );

    this.router.get(this.path + ':documentHash', authenticateApiKey, this.documentsController.getDocument);
  }
}

export default DocumentsRouter;
