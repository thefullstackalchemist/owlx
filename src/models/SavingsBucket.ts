import mongoose, { Schema, Document } from "mongoose";

export interface ISavingsBucket extends Document {
  name:        string;
  description?: string;
  target:      number;
  accountId:   mongoose.Types.ObjectId;
  color:       string;
  active:      boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

const SavingsBucketSchema = new Schema<ISavingsBucket>(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    target:      { type: Number, required: true, min: 1 },
    accountId:   { type: Schema.Types.ObjectId, ref: "Account", required: true },
    color:       { type: String, default: "#6366f1" },
    active:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SavingsBucket =
  (mongoose.models.SavingsBucket as mongoose.Model<ISavingsBucket>) ||
  mongoose.model<ISavingsBucket>("SavingsBucket", SavingsBucketSchema);
