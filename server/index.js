import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '50mb' }));
app.use(cors());

// חיבור גמיש למסד הנתונים
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URL;
mongoose.connect(mongoURI)
  .then(() => console.log('✅ TAT PRO Database Connected'))
  .catch(err => console.error('❌ Connection Error:', err));

// --- הגדרת המודלים (Schemas) ---

const donorSchema = new mongoose.Schema({ id: String }, { strict: false });
const donationSchema = new mongoose.Schema({ id: String }, { strict: false });
const userSchema = new mongoose.Schema({ id: String }, { strict: false });
const groupSchema = new mongoose.Schema({ id: String }, { strict: false });
const expenseSchema = new mongoose.Schema({ id: String }, { strict: false });
const customerSchema = new mongoose.Schema({ id: String }, { strict: false });
const rankSchema = new mongoose.Schema({ id: String }, { strict: false });
const giftSchema = new mongoose.Schema({ id: String }, { strict: false });
const lotterySchema = new mongoose.Schema({ id: String }, { strict: false });
const patrolSchema = new mongoose.Schema({ id: String }, { strict: false });

// מודלים חדשים:
const pathSchema = new mongoose.Schema({ 
  id: String, 
  assignedRepIds: [String], 
  addresses: Array 
}, { strict: false });

const callListSchema = new mongoose.Schema({ 
  id: String, 
  assignedRepIds: [String], 
  donors: Array 
}, { strict: false });

const repMessageSchema = new mongoose.Schema({ 
  id: String, 
  repId: String, 
  status: String 
}, { strict: false });

const systemMessageSchema = new mongoose.Schema({ 
  id: String, 
  targetIds: [String] 
}, { strict: false });

// יצירת המודלים
const Models = {
  Donor: mongoose.model('Donor', donorSchema),
  Donation: mongoose.model('Donation', donationSchema),
  User: mongoose.model('User', userSchema),
  Group: mongoose.model('Group', groupSchema),
  Expense: mongoose.model('Expense', expenseSchema),
  Customer: mongoose.model('Customer', customerSchema),
  Rank: mongoose.model('Rank', rankSchema),
  Gift: mongoose.model('Gift', giftSchema),
  Lottery: mongoose.model('Lottery', lotterySchema),
  Patrol: mongoose.model('Patrol', patrolSchema),
  Path: mongoose.model('Path', pathSchema),
  CallList: mongoose.model('CallList', callListSchema),
  RepMessage: mongoose.model('RepMessage', repMessageSchema),
  SystemMessage: mongoose.model('SystemMessage', systemMessageSchema)
};

// פונקציית מיפוי
const getModel = (collection) => {
  switch (collection) {
    case 'donors': return Models.Donor;
    case 'donations': return Models.Donation;
    case 'campaigns': return Models.Campaign || mongoose.model('Campaign', new mongoose.Schema({ id: String }, { strict: false }));
    case 'users': return Models.User;
    case 'groups': return Models.Group;
    case 'expenses': return Models.Expense;
    case 'customers': return Models.Customer;
    case 'ranks': return Models.Rank;
    case 'gifts': return Models.Gift;
    case 'lotteries': return Models.Lottery;
    case 'patrols': return Models.Patrol;
    case 'paths': return Models.Path;
    case 'callLists': return Models.CallList;
    case 'repToAdminMessages': return Models.RepMessage;
    case 'systemMessages': return Models.SystemMessage;
    default: return null;
  }
};

// --- מנגנון API ---

app.get('/api/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const Model = getModel(collection);
    
    if (!Model) {
      return res.status(404).send('Collection not found');
    }
    
    const data = await Model.find();
    res.json(data);
  } catch (err) { 
    res.status(500).json(err); 
  }
});

app.post('/api/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const Model = getModel(collection);
    
    if (!Model) return res.status(404).send('Collection not found');

    const result = await Model.findOneAndUpdate(
      { id: req.body.id },
      req.body,
      { upsert: true, new: true }
    );
    res.json(result);
  } catch (err) { 
    res.status(500).json(err); 
  }
});

app.delete('/api/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const Model = getModel(collection);
    
    if (!Model) return res.status(404).send('Collection not found');

    await Model.findOneAndDelete({ id: id });
    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});

// --- הגשת האתר ---
app.use(express.static(path.join(__dirname, '../dist')));

// התיקון: שימוש ב-RegEx (/.*/) במקום '*' כדי למנוע את שגיאת ה-PathError
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 TAT PRO Server Live on ${PORT}`));