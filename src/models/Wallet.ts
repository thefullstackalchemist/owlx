import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  name:      string;
  balance:   number;
  color:     string;
  active:    boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    name:    { type: String, required: true, trim: true },
    balance: { type: Number, default: 0 },
    color:   { type: String, default: "#f59e0b" },
    active:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Wallet =
  (mongoose.models.Wallet as mongoose.Model<IWallet>) ||
  mongoose.model<IWallet>("Wallet", WalletSchema);
