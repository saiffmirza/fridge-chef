import mongoose, { Document } from 'mongoose';

export interface ISavedIngredient {
  text: string;
  missing: boolean;
  alternatives: string[];
}

export interface ISavedRecipe extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  readyInMinutes: number;
  summary: string;
  ingredients: ISavedIngredient[];
  steps: string[];
  savedAt: Date;
}

const ingredientSchema = new mongoose.Schema<ISavedIngredient>(
  {
    text: { type: String, required: true, trim: true },
    missing: { type: Boolean, default: false },
    alternatives: { type: [String], default: [] },
  },
  { _id: false },
);

const savedRecipeSchema = new mongoose.Schema<ISavedRecipe>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  readyInMinutes: { type: Number, required: true },
  summary: { type: String, default: '' },
  ingredients: { type: [ingredientSchema], default: [] },
  steps: { type: [String], default: [] },
  savedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISavedRecipe>('SavedRecipe', savedRecipeSchema);
