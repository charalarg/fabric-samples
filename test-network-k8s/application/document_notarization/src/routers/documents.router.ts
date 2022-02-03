import express from 'express';
import { body } from 'express-validator';
import { validateStructure } from '../middlewares/validate';
import { loadIdentity } from '../middlewares/wallet';
import { authenticateApiKey } from '../middlewares/auth';
import DocumentsController from '../controllers/documents.controller';

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
      body().isObject().withMessage('body must contain an document object'),
      validateStructure,
      loadIdentity,
      this.documentsController.createDocument
    );

    this.router.post(
      this.path + 'validate',
      authenticateApiKey,
      body().isObject().withMessage('body must contain an document object'),
      validateStructure,
      loadIdentity,
      this.documentsController.validateDocument
    );

    this.router.get(this.path + ':documentHash', authenticateApiKey, this.documentsController.getDocument);
  }
}

export default DocumentsRouter;
