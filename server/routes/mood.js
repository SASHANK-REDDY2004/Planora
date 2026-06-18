const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Preset quotes based on mood rating (1: Very Sad, 5: Fantastic)
const quotes = {
  1: [
    "It's okay to have bad days. Progress is not linear. Be kind to yourself.",
    "This too shall pass. Take a deep breath and take it one moment at a time.",
    "Every tomorrow is a fresh start. Today, just focus on resting and breathing.",
    "You are stronger than you know. Tough times don't last, tough people do."
  ],
  2: [
    "Small steps are still steps. You are doing the best you can.",
    "Difficult roads often lead to beautiful destinations. Keep going.",
    "You don't have to run; walking is just fine. Just keep moving forward.",
    "Be proud of how hard you are trying. Every effort counts."
  ],
  3: [
    "Focus on the present moment. That is where your power lies.",
    "Consistency is the key to progress. Keep showing up for yourself.",
    "Peace is a daily practice. Start from exactly where you are.",
    "A neutral day is a perfect canvas. Paint it with tiny bits of focus."
  ],
  4: [
    "Your energy is your power. Direct it towards what you love today.",
    "Action is the foundational key to all success. You've got this!",
    "Believe you can and you are halfway there. Keep building momentum.",
    "Make today count. Your future self will thank you for the work you do now."
  ],
  5: [
    "You are unstoppable! Channel this incredible energy into your biggest dreams.",
    "The best way to predict the future is to create it. You are doing exactly that!",
    "Your potential is limitless. Go out and conquer the day!",
    "Success is the sum of small efforts repeated day in and day out. Celebrate today!"
  ]
};

function getRandomQuote(moodRating) {
  const rating = Math.min(Math.max(parseInt(moodRating) || 3, 1), 5);
  const quoteList = quotes[rating];
  const randomIndex = Math.floor(Math.random() * quoteList.length);
  return quoteList[randomIndex];
}

// @route   GET api/mood
// @desc    Get all mood logs for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const logs = await db.MoodLog.find({ userId: req.userId });
    // Sort manually by date descending if in JSON DB (Mongoose can do this, but manually doing it covers both)
    logs.sort((a, b) => b.date.localeCompare(a.date));
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/mood
// @desc    Log or update daily mood
// @access  Private
router.post('/', auth, async (req, res) => {
  const { mood, notes, date } = req.body;

  if (mood === undefined || !date) {
    return res.status(400).json({ message: 'Mood rating and date are required' });
  }

  const moodRating = parseInt(mood);
  if (moodRating < 1 || moodRating > 5) {
    return res.status(400).json({ message: 'Mood must be between 1 and 5' });
  }

  try {
    // Check if there is already a mood logged for this date
    let moodLog = await db.MoodLog.findOne({ userId: req.userId, date });
    const quote = getRandomQuote(moodRating);

    if (moodLog) {
      // Update existing mood log
      moodLog = await db.MoodLog.findByIdAndUpdate(
        moodLog._id,
        { mood: moodRating, notes: notes || "", quote },
        { new: true }
      );
      return res.json(moodLog);
    }

    // Create new mood log
    moodLog = await db.MoodLog.create({
      userId: req.userId,
      mood: moodRating,
      notes: notes || "",
      quote,
      date
    });

    res.status(201).json(moodLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
