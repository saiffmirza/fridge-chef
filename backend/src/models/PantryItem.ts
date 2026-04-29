import mongoose, { Document } from 'mongoose';

export interface IPantryItem extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  expiresAt?: Date;
}

const pantryItemSchema = new mongoose.Schema<IPantryItem>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  expiresAt: { type: Date },
});

export default mongoose.model<IPantryItem>('PantryItem', pantryItemSchema);
