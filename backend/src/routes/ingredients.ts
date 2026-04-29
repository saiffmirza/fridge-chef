import { Router, Response } from 'express';
import FridgeItem from '../models/FridgeItem';
import PantryItem from '../models/PantryItem';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// --- Fridge ---
router.get('/fridge', async (req: AuthRequest, res: Response) => {
  const items = await FridgeItem.find({ userId: req.userId }).sort({ addedAt: -1 });
  res.json(items);
});

router.post('/fridge', async (req: AuthRequest, res: Response) => {
  const { name, expiresAt } = req.body;
  if (!name) { res.status(400).json({ error: 'Name is required' }); return; }
  const item = await FridgeItem.create({ userId: req.userId, name, expiresAt });
  res.status(201).json(item);
});

router.patch('/fridge/:id', async (req: AuthRequest, res: Response) => {
  const item = await FridgeItem.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: req.body },
    { new: true },
  );
  if (!item) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(item);
});

router.delete('/fridge/:id', async (req: AuthRequest, res: Response) => {
  await FridgeItem.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.status(204).send();
});

// --- Pantry ---
router.get('/pantry', async (req: AuthRequest, res: Response) => {
  const items = await PantryItem.find({ userId: req.userId });
  res.json(items);
});

router.post('/pantry', async (req: AuthRequest, res: Response) => {
  const { name, expiresAt } = req.body;
  if (!name) { res.status(400).json({ error: 'Name is required' }); return; }
  const item = await PantryItem.create({ userId: req.userId, name, expiresAt });
  res.status(201).json(item);
});

router.patch('/pantry/:id', async (req: AuthRequest, res: Response) => {
  const item = await PantryItem.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: req.body },
    { new: true },
  );
  if (!item) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(item);
});

router.delete('/pantry/:id', async (req: AuthRequest, res: Response) => {
  await PantryItem.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.status(204).send();
});

export default router;
