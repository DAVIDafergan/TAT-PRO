import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import * as Models from './models.js'; // ייבוא כל המודלים

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '50mb' }));
app.use(cors());

// חיבור גמיש למסד הנתונים (תומך ב-MONGO_URL מהצילום מסך שלך)
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URL;
mongoose.connect(mongoURI)
  .then(() => console.log('✅ TAT PRO Database Connected'))
  .catch(err => console.error('❌ Connection Error:', err));

// --- מנגנון API דינמי לכל סוגי הנתונים ---

// קבלת נתונים (למשל: /api/donations או /api/campaigns)
app.get('/api/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const ModelName = collection.charAt(0).toUpperCase() + collection.slice(1, -1); // הופך donations ל-Donation
    const Model = Models[ModelName] || Models[collection.charAt(0).toUpperCase() + collection.slice(1)];
    
    if (!Model) return res.status(404).send('Collection not found');
    
    const data = await Model.find();
    res.json(data);
  } catch (err) { res.status(500).json(err); }
});

// שמירה/עדכון נתונים (מזהה אוטומטית לפי ה-ID של האובייקט)
app.post('/api/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const ModelName = collection.charAt(0).toUpperCase() + collection.slice(1, -1);
    const Model = Models[ModelName] || Models[collection.charAt(0).toUpperCase() + collection.slice(1)];
    
    if (!Model) return res.status(404).send('Collection not found');

    // מבצע Update אם קיים ID, אחרת יוצר חדש (Upsert)
    const result = await Model.findOneAndUpdate(
      { id: req.body.id },
      req.body,
      { upsert: true, new: true }
    );
    res.json(result);
  } catch (err) { res.status(500).json(err); }
});

// מחיקת נתונים
app.delete('/api/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const ModelName = collection.charAt(0).toUpperCase() + collection.slice(1, -1);
    const Model = Models[ModelName];
    await Model.findOneAndDelete({ id: id });
    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});

// --- הגשת האתר ---
app.use(express.static(path.join(__dirname, '../dist')));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 TAT PRO Server Live on ${PORT}`));