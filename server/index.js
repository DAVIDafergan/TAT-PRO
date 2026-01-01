const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '50mb' })); // תמיכה בכמות נתונים גדולה
app.use(cors());

// חיבור למסד הנתונים MongoDB מתוך משתני הסביבה של Railway
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB via Railway'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// יצירת סכמה גמישה השומרת את כל מצב האפליקציה (DBStore)
const AppStateSchema = new mongoose.Schema({
  id: { type: String, default: 'main_db' },
  content: Object,
  lastUpdated: { type: Date, default: Date.now }
}, { minimize: false });

const AppState = mongoose.model('AppState', AppStateSchema);

// נתיב לקבלת כל הנתונים
app.get('/api/data', async (req, res) => {
  try {
    const state = await AppState.findOne({ id: 'main_db' });
    res.json(state ? state.content : null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load data' });
  }
});

// נתיב לשמירת כל הנתונים
app.post('/api/data', async (req, res) => {
  try {
    await AppState.findOneAndUpdate(
      { id: 'main_db' },
      { content: req.body, lastUpdated: new Date() },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));