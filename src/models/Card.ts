import mongoose, { Schema, Document } from "mongoose";

export type CardType    = "debit_card" | "credit_card";
export type CardNetwork = "Visa" | "Mastercard" | "RuPay" | "Amex" | "Diners";

export interface ICard extends Document {
  name:         string;
  bank:         string;
  type:         CardType;
  parentId?:    mongoose.Types.ObjectId; // debit_card / credit_card → ref savings/current Account
  lastFour?:    string;
  network?:     CardNetwork;
  balance:      number;   // debit_card: mirror only; credit_card: available credit
  creditLimit?: number;   // credit_card only
  isCredit:     boolean;
  color:        string;
  active:       boolean;
  createdAt:    Date;
  updatedAt:    Date;
}

const CardSchema = new Schema<ICard>(
  {
    name:        { type: String, required: true, trim: true },
    bank:        { type: String, required: true, trim: true },
    type:        { type: String, required: true, enum: ["debit_card", "credit_card"] },
    parentId:    { type: Schema.Types.ObjectId, ref: "Account" },
    lastFour:    { type: String, match: /^\d{4}$/ },
    network:     { type: String, enum: ["Visa", "Mastercard", "RuPay", "Amex", "Diners"] },
    balance:     { type: Number, default: 0 },
    creditLimit: { type: Number },
    isCredit:    { type: Boolean, default: false },
    color:       { type: String, default: "#10b981" },
    active:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

CardSchema.index({ parentId: 1 });

export const Card =
  (mongoose.models.Card as mongoose.Model<ICard>) ||
  mongoose.model<ICard>("Card", CardSchema);
