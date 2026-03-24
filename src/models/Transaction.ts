import mongoose, { Schema, Document } from "mongoose";
import type { TransactionCategory } from "@/constants";

export interface ITransaction extends Document {
  date:           Date;
  amount:         number;
  type:           "income" | "expense" | "transfer";
  category:       TransactionCategory;
  description:    string;
  platform?:      string;
  tags?:          string[];
  accountId?:     mongoose.Types.ObjectId;
  accountRef:     "Account" | "Card" | "Wallet";
  needsRepayment: boolean;
  createdAt:      Date;
  updatedAt:      Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    date:           { type: Date,   required: true },
    amount:         { type: Number, required: true, min: 0 },
    type:           { type: String, required: true, enum: ["income", "expense", "transfer"] },
    category:       { type: String, required: true },
    description:    { type: String, required: true },
    platform:       { type: String },
    tags:           [{ type: String }],
    accountId:      { type: Schema.Types.ObjectId, refPath: "accountRef" },
    accountRef:     { type: String, enum: ["Account", "Card", "Wallet"], default: "Account" },
    needsRepayment: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TransactionSchema.index({ date: -1 });
TransactionSchema.index({ type: 1, date: -1 });
TransactionSchema.index({ category: 1, date: -1 });

export const Transaction =
  (mongoose.models.Transaction as mongoose.Model<ITransaction>) ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
