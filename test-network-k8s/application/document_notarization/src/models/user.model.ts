import { Schema, model, Model } from 'mongoose';
import { hash, compare } from 'bcrypt';
import * as config from '../config/config';

interface IUser {
  userId: string;
  password: string;
}

interface IUserModel extends Model<IUser> {
  findByCredentials(userId: string, password: string): Promise<IUser>;
}

const UserSchema = new Schema<IUser, IUserModel>({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

UserSchema.statics.findByCredentials = async (userId: string, password: string) => {
  const user = await UserModel.findOne({ userId });
  const isMatch = user && user.password ? await compare(password, user.password) : false;
  return isMatch ? user : null;
};

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hash(this.password, config.encSaltRounds);
  }
  return next();
});

const UserModel = model<IUser, IUserModel>('User', UserSchema, 'users');
export default UserModel;
