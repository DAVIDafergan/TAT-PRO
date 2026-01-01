import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// חיבור למסד הנתונים
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB via Railway'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// הגדרת הסכימה
const AppStateSchema = new mongoose.Schema({
  id: { type: String, default: 'main_db' },
  content: Object,
  lastUpdated: { type: Date, default: Date.now }
}, { minimize: false });

const AppState = mongoose.model('AppState', AppStateSchema);

// נתיב לקבלת נתונים
app.get('/api/data', async (req, res) => {
  try {
    const state = await AppState.findOne({ id: 'main_db' });
    res.json(state ? state.content : null);
  } catch (err) {
    res.status(500).json({ error: 'Load failed' });
  }
});

// נתיב לשמירת נתונים
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
