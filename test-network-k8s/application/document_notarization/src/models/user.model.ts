import { Schema, model, Model } from 'mongoose';
import { hash, compare } from 'bcrypt';
import * as config from '../config/config';

export enum Role {
  OrgAdmin = 'OrgAdmin',
  Admin = 'Admin',
  User = 'User',
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export interface IUser {
  userId: string;
  registrarId: string;
  password: string;
  role: Role;
  name?: string;
  surname?: string;
  nationalId?: string;
  dateOfBirth?: Date;
  gender?: Gender;
}

interface IUserModel extends Model<IUser> {
  findByCredentials(userId: string, password: string): Promise<IUser>;
  findByUserId(userId: string): Promise<IUser>;
  findByRegistrar(registrarId: string): Promise<IUser[]>;
  createUser(
    userI: string,
    registrarId: string,
    password: string,
    role: Role,
    name?: string,
    surname?: string,
    nationalId?: string,
    dateOfBirth?: Date,
    gender?: Gender
  ): Promise<VoidFunction>;
}

const UserSchema = new Schema<IUser, IUserModel>({
  userId: { type: String, required: true, unique: true },
  registrarId: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: Object.values(Role) },
  name: { type: String, required: false },
  surname: { type: String, required: false },
  nationalId: { type: String, required: false },
  dateOfBirth: { type: Date, required: false },
  gender: { type: String, required: false, enum: Object.values(Gender) },
});

UserSchema.statics.findByCredentials = async (userId: string, password: string) => {
  const user = await UserModel.findOne({ userId });
  const isMatch = user && user.password ? await compare(password, user.password) : false;
  return isMatch ? user : null;
};

UserSchema.statics.findByUserId = async (userId: string) => {
  const user = await UserModel.findOne({ userId });
  return user ? user : null;
};

UserSchema.statics.findByRegistrar = async (registrarId: string) => {
  const users = await UserModel.find({ registrarId });
  return users ? users : [];
};

UserSchema.statics.createUser = async (
  userId: string,
  registrarId: string,
  password: string,
  role: Role,
  name?: string,
  surname?: string,
  nationalId?: string,
  dateOfBirth?: Date,
  gender?: Gender
) => {
  password = await hash(password, config.encSaltRounds);
  await UserModel.findOneAndUpdate(
    { userId },
    { userId, registrarId, password, name, surname, nationalId, dateOfBirth, gender, role },
    { upsert: true }
  );
};

const UserModel = model<IUser, IUserModel>('User', UserSchema, 'users');
export default UserModel;
