import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username:     string;
  displayName:  string;
  passwordHash: string;
  createdAt:    Date;
  updatedAt:    Date;
}

const UserSchema = new Schema<IUser>(
  {
    username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName:  { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);
