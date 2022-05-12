// import { Schema, model, Model } from 'mongoose';
// import { hash, compare } from 'bcrypt';
// import * as config from '../config/config';
//
// interface IDocument {
//   documentId: string;
//   userId: string;
// }
//
// interface IDocumentModel extends Model<IDocument> {
//   findByCredentials(documentId: string, password: string): Promise<IDocument>;
//   createDocument(documentId: string, password: string, role: Role): Promise<VoidFunction>;
// }
//
// const DocumentSchema = new Schema<IDocument, IDocumentModel>({
//   documentId: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, required: true, enum: Object.values(Role) },
// });
//
// DocumentSchema.statics.findByCredentials = async (documentId: string, password: string) => {
//   const document = await DocumentModel.findOne({ documentId });
//   const isMatch = document && document.password ? await compare(password, document.password) : false;
//   return isMatch ? document : null;
// };
//
// DocumentSchema.statics.createDocument = async (documentId: string, password: string, role: Role) => {
//   password = await hash(password, config.encSaltRounds);
//   await DocumentModel.findOneAndUpdate({ documentId }, { documentId, password, role }, { upsert: true });
// };
//
// const DocumentModel = model<IDocument, IDocumentModel>('Document', DocumentSchema, 'documents');
// export default DocumentModel;
