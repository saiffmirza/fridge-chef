import mongoose, { Document } from 'mongoose';

export interface IFridgeItem extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  expiresAt?: Date;
  addedAt: Date;
}

const fridgeItemSchema = new mongoose.Schema<IFridgeItem>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  expiresAt: { type: Date },
  addedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IFridgeItem>('FridgeItem', fridgeItemSchema);
