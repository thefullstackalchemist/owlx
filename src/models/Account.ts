import mongoose, { Schema, Document } from "mongoose";

export type AccountType =
  | "savings"
  | "current"
  | "credit_card"
  | "debit_card"
  | "upi"
  | "wallet";

export type CardNetwork = "Visa" | "Mastercard" | "RuPay" | "Amex" | "Diners";
export type UpiApp     = "Google Pay" | "PhonePe" | "Paytm" | "BHIM" | "Amazon Pay" | "Other";

export interface IAccount extends Document {
  name:       string;
  bank:       string;           // bank name for accounts/cards/UPI; provider for wallets
  type:       AccountType;
  parentId?:  mongoose.Types.ObjectId; // cards & UPI → ref to savings/current account
  lastFour?:  string;
  network?:   CardNetwork;      // cards only
  upiId?:     string;           // UPI only  (e.g. "9876543210@hdfcbank")
  upiApp?:    UpiApp;           // UPI only
  balance?:   number;           // wallets only
  isCredit:   boolean;
  color:      string;
  active:     boolean;
  createdAt:  Date;
  updatedAt:  Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    name:     { type: String,                        required: true, trim: true },
    bank:     { type: String,                        required: true, trim: true },
    type:     { type: String,                        required: true, enum: ["savings", "current", "credit_card", "debit_card", "upi", "wallet"] },
    parentId: { type: Schema.Types.ObjectId, ref: "Account" },
    lastFour: { type: String, match: /^\d{4}$/ },
    network:  { type: String, enum: ["Visa", "Mastercard", "RuPay", "Amex", "Diners"] },
    upiId:    { type: String, trim: true },
    upiApp:   { type: String, enum: ["Google Pay", "PhonePe", "Paytm", "BHIM", "Amazon Pay", "Other"] },
    balance:  { type: Number, min: 0 },
    isCredit: { type: Boolean, default: false },
    color:    { type: String,  default: "#6366f1" },
    active:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

AccountSchema.index({ parentId: 1 });

export const Account =
  (mongoose.models.Account as mongoose.Model<IAccount>) ||
  mongoose.model<IAccount>("Account", AccountSchema);
