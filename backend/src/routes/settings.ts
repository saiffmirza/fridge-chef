import { Router, Response } from 'express';
import crypto from 'crypto';
import { AuthRequest, authenticate } from '../middleware/auth';
import UserSettings, { AiProvider } from '../models/UserSettings';

const router = Router();
router.use(authenticate);

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

function encryptApiKey(apiKey: string): { encrypted: string; iv: string; authTag: string } {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
}

export function decryptApiKey(encrypted: string, iv: string, authTag: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string');
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}

const VALID_PROVIDERS: AiProvider[] = ['gemini', 'claude', 'openai'];

// GET /api/settings/ai-provider
router.get('/ai-provider', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.userId });
    res.json({
      aiProvider: settings?.aiProvider ?? 'gemini',
      hasApiKey: !!settings?.encryptedApiKey,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

// PUT /api/settings/ai-provider
router.put('/ai-provider', async (req: AuthRequest, res: Response) => {
  const { aiProvider, apiKey } = req.body as { aiProvider: unknown; apiKey: unknown };

  if (typeof aiProvider !== 'string' || !VALID_PROVIDERS.includes(aiProvider as AiProvider)) {
    res.status(400).json({ error: 'Invalid AI provider. Choose gemini, claude, or openai.' });
    return;
  }

  const provider = aiProvider as AiProvider;

  // Custom providers require an API key
  if (provider !== 'gemini' && (typeof apiKey !== 'string' || !apiKey.trim())) {
    res.status(400).json({ error: 'An API key is required for this provider.' });
    return;
  }

  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    res.status(503).json({ error: 'Custom AI providers are not configured on this server.' });
    return;
  }

  try {
    const update: Record<string, unknown> = { aiProvider: provider };

    if (typeof apiKey === 'string' && apiKey.trim()) {
      const { encrypted, iv, authTag } = encryptApiKey(apiKey.trim());
      update.encryptedApiKey = encrypted;
      update.iv = iv;
      update.authTag = authTag;
    } else {
      // Gemini with no key — clear stored key
      update.encryptedApiKey = undefined;
      update.iv = undefined;
      update.authTag = undefined;
    }

    await UserSettings.findOneAndUpdate(
      { userId: req.userId },
      { $set: update },
      { upsert: true, new: true },
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// DELETE /api/settings/ai-provider — revert to default Gemini
router.delete('/ai-provider', async (req: AuthRequest, res: Response) => {
  try {
    await UserSettings.findOneAndUpdate(
      { userId: req.userId },
      { $set: { aiProvider: 'gemini', encryptedApiKey: undefined, iv: undefined, authTag: undefined } },
      { upsert: true },
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to reset settings.' });
  }
});

export default router;
