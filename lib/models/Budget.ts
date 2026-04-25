import mongoose, { Schema, model, models } from "mongoose";

const BudgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    amount: { type: Number, required: true },
    period: { type: String, enum: ["monthly", "weekly", "yearly"], default: "monthly" },
    month: { type: Number }, // 1–12, used when period = "monthly"
    year: { type: Number },
  },
  { timestamps: true }
);

export const Budget = models.Budget || model("Budget", BudgetSchema);