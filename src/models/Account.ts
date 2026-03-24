import mongoose, { Schema, Document } from "mongoose";

export type AccountType = "savings" | "current" | "credit_card" | "debit_card" | "wallet" | "upi";

export interface IAccount extends Document {
  name:       string;
  bank:       string;
  type:       AccountType;
  lastFour?:  string;
  isCredit:   boolean;
  color:      string;
  active:     boolean;
  createdAt:  Date;
  updatedAt:  Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    name:     { type: String, required: true, trim: true },
    bank:     { type: String, required: true, trim: true },
    type:     { type: String, required: true, enum: ["savings", "current", "credit_card", "debit_card", "wallet", "upi"] },
    lastFour: { type: String, match: /^\d{4}$/ },
    isCredit: { type: Boolean, default: false },
    color:    { type: String, default: "#6366f1" },
    active:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Account =
  (mongoose.models.Account as mongoose.Model<IAccount>) ||
  mongoose.model<IAccount>("Account", AccountSchema);
