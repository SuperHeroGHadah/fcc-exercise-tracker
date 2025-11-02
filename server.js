require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false })); // form-urlencoded for FCC

// (Optional) Root page if you have views/index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// ---------- Database ----------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err.message));

// ---------- Schemas & Models ----------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration:    { type: Number, required: true },
  date:        { type: Date, required: true }, // store as Date, format in responses
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// ---------- Routes ----------

// POST /api/users – create user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users – list users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:_id/exercises – add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.json({ error: 'User not found' });

    const { description, duration, date } = req.body;

    const exercise = new Exercise({
      userId: user._id,
      description,
      duration: Number(duration),
      date: date ? new Date(date) : new Date(),
    });

    await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: exercise.date.toDateString(),
      duration: exercise.duration,
      description: exercise.description,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:_id/logs – exercise log with filters
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.json({ error: 'User not found' });

    const { from, to, limit } = req.query;

    const match = { userId: user._id };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to)   match.date.$lte = new Date(to);
    }

    let query = Exercise.find(match).select('description duration date');
    if (limit) query = query.limit(Number(limit));

    const exercises = await query.exec();

    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    }));

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Server ----------
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('🚀 Server listening on port', listener.address().port);
});
