import { Schema, model, Model } from 'mongoose';
import { hash, compare } from 'bcrypt';
import * as config from '../config/config';

export enum Role {
  OrgAdmin = 'OrgAdmin',
  Admin = 'Admin',
  User = 'User',
}

interface IUser {
  userId: string;
  password: string;
  role: Role;
}

interface IUserModel extends Model<IUser> {
  findByCredentials(userId: string, password: string): Promise<IUser>;
  createUser(userId: string, password: string, role: Role): Promise<VoidFunction>;
}

const UserSchema = new Schema<IUser, IUserModel>({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: Object.values(Role) },
});

UserSchema.statics.findByCredentials = async (userId: string, password: string) => {
  const user = await UserModel.findOne({ userId });
  const isMatch = user && user.password ? await compare(password, user.password) : false;
  return isMatch ? user : null;
};

UserSchema.statics.createUser = async (userId: string, password: string, role: Role) => {
  password = await hash(password, config.encSaltRounds);
  await UserModel.findOneAndUpdate({ userId }, { userId, password, role }, { upsert: true });
};

// UserSchema.pre('save', async function (next) {
//   if (this.isModified('password')) {
//     this.password = await hash(this.password, config.encSaltRounds);
//   }
//   return next();
// });

const UserModel = model<IUser, IUserModel>('User', UserSchema, 'users');
export default UserModel;
