import mongoose, { Schema, Document } from 'mongoose';

export type AiProvider = 'gemini' | 'claude' | 'openai';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  aiProvider: AiProvider;
  encryptedApiKey?: string;
  iv?: string;
  authTag?: string;
}

const UserSettingsSchema = new Schema<IUserSettings>({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
  aiProvider: { type: String, enum: ['gemini', 'claude', 'openai'], default: 'gemini' },
  encryptedApiKey: { type: String },
  iv: { type: String },
  authTag: { type: String },
});

export default mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
