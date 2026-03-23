import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage extends Document {
  role:      "user" | "assistant";
  content:   string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role:    { type: String, required: true, enum: ["user", "assistant"] },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ createdAt: -1 });

export const ChatMessage =
  (mongoose.models.ChatMessage as mongoose.Model<IChatMessage>) ||
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
