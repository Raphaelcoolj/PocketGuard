import mongoose, { Schema, model, models } from "mongoose";

const CategorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "📦" },
    color: { type: String, default: "#6366f1" },
    type: { type: String, enum: ["income", "expense"], required: true },
  },
  { timestamps: true }
);

export const Category = models.Category || model("Category", CategorySchema);