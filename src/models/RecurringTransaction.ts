import mongoose, { Schema, Document } from "mongoose";
import type { TransactionCategory } from "@/constants";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export interface IRecurringTransaction extends Document {
  amount:      number;
  type:        "income" | "expense" | "transfer";
  category:    TransactionCategory;
  description: string;
  platform?:   string;
  frequency:   Frequency;
  nextDue:     Date;
  active:      boolean;
  accountId:   mongoose.Types.ObjectId;
  createdAt:   Date;
  updatedAt:   Date;
}

const RecurringSchema = new Schema<IRecurringTransaction>(
  {
    amount:      { type: Number,                        required: true, min: 0 },
    type:        { type: String,                        required: true, enum: ["income", "expense", "transfer"] },
    category:    { type: String,                        required: true },
    description: { type: String,                        required: true },
    platform:    { type: String },
    frequency:   { type: String,                        required: true, enum: ["daily", "weekly", "monthly", "yearly"] },
    nextDue:     { type: Date,                          required: true },
    active:      { type: Boolean,                       default: true },
    accountId:   { type: Schema.Types.ObjectId, ref: "Account", required: true },
  },
  { timestamps: true }
);

RecurringSchema.index({ nextDue: 1, active: 1 });

export const RecurringTransaction =
  (mongoose.models.RecurringTransaction as mongoose.Model<IRecurringTransaction>) ||
  mongoose.model<IRecurringTransaction>("RecurringTransaction", RecurringSchema);
