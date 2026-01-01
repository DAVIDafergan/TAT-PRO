import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// הגדרות בסיסיות
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// חיבור למסד הנתונים
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB via Railway'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const AppStateSchema = new mongoose.Schema({
  id: { type: String, default: 'main_db' },
  content: Object,
  lastUpdated: { type: Date, default: Date.now }
}, { minimize: false });

const AppState = mongoose.model('AppState', AppStateSchema);

// נתיבי API
app.get('/api/data', async (req, res) => {
  try {
    const state = await AppState.findOne({ id: 'main_db' });
    res.json(state ? state.content : null);
  } catch (err) {
    res.status(500).json({ error: 'Load failed' });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    await AppState.findOneAndUpdate(
      { id: 'main_db' },
      { content: req.body, lastUpdated: new Date() },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Save failed' });
  }
});

// --- הגשת קבצי האתר (Frontend) ---
app.use(express.static(path.join(__dirname, '../dist')));

// ✅ התיקון הסופי והמחייב עבור Node v22:
// הגדרת פרמטר בשם 'any' כדי ש-path-to-regexp לא יזרוק שגיאה
app.get('/:any*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
