import mongoose, { Schema, model, models } from "mongoose";

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    amount: { type: Number, required: true }, // always positive; type determines direction
    type: { type: String, enum: ["income", "expense"], required: true },
    description: { type: String },
    date: { type: Date, required: true, default: Date.now },
    source: { type: String, enum: ["manual", "plaid"], default: "manual" },
    plaidTransactionId: { type: String }, // for dedup later
  },
  { timestamps: true }
);

export const Transaction = models.Transaction || model("Transaction", TransactionSchema);