import { connectDB } from "@/lib/mongodb";
import { Card } from "@/models/Card";
import type { CardType, CardNetwork } from "@/models/Card";

export interface CardData {
  name:         string;
  bank:         string;
  type:         CardType;
  parentId?:    string;
  lastFour?:    string;
  network?:     CardNetwork;
  balance?:     number;
  creditLimit?: number;
  color?:       string;
}

export async function listCards() {
  await connectDB();
  return Card.find({ active: true }).sort({ createdAt: 1 }).lean();
}

export async function createCard(data: CardData) {
  await connectDB();
  return Card.create({
    ...data,
    isCredit: data.type === "credit_card",
    color: data.color ?? (data.type === "credit_card" ? "#f43f5e" : "#10b981"),
  });
}

export async function updateCard(id: string, data: Partial<CardData>) {
  await connectDB();
  const update: Record<string, unknown> = { ...data };
  if (data.type) update.isCredit = data.type === "credit_card";
  return Card.findByIdAndUpdate(id, { $set: update }, { new: true });
}

export async function deleteCard(id: string) {
  await connectDB();
  return Card.findByIdAndUpdate(id, { $set: { active: false } });
}
