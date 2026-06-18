const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Helper to calculate consecutive day streak ending today or yesterday
function calculateStreak(history, todayStr) {
  if (!history || history.length === 0) return 0;

  // Filter out duplicates and sort dates descending (e.g. ['2026-06-18', '2026-06-17', ...])
  const uniqueDates = [...new Set(history)].sort().reverse();

  const parseDate = (str) => {
    const [year, month, day] = str.split('-').map(Number);
    // Use UTC representation to prevent local timezone shifts
    return new Date(Date.UTC(year, month - 1, day));
  };

  const getDayDiff = (d1Str, d2Str) => {
    const date1 = parseDate(d1Str);
    const date2 = parseDate(d2Str);
    const diffTime = Math.abs(date1 - date2);
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const latestDateStr = uniqueDates[0];
  const diffFromToday = getDayDiff(todayStr, latestDateStr);

  // If latest completion is more than 1 day ago (neither today nor yesterday), the streak is broken
  if (diffFromToday > 1) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const diff = getDayDiff(uniqueDates[i], uniqueDates[i+1]);
    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      break; // Gap detected, streak ends here
    }
    // If diff === 0, it's a duplicate date (shouldn't happen with Set, but skip just in case)
  }

  return streak;
}

// @route   GET api/habits
// @desc    Get all habits for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const habits = await db.Habit.find({ userId: req.userId });
    res.json(habits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/habits
// @desc    Create a new habit
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const newHabit = await db.Habit.create({
      userId: req.userId,
      name,
      history: [],
      streak: 0
    });

    res.status(201).json(newHabit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/habits/:id/toggle
// @desc    Toggle completion of a habit on a specific date
// @access  Private
router.put('/:id/toggle', auth, async (req, res) => {
  const { date, today } = req.body; // 'YYYY-MM-DD' format

  if (!date || !today) {
    return res.status(400).json({ message: 'Date and today date are required' });
  }

  try {
    let habit = await db.Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.userId.toString() !== req.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Toggle date in history
    let newHistory = [...habit.history];
    const index = newHistory.indexOf(date);
    
    if (index > -1) {
      // Remove date
      newHistory.splice(index, 1);
    } else {
      // Add date
      newHistory.push(date);
    }

    // Calculate updated streak based on the new history
    const updatedStreak = calculateStreak(newHistory, today);

    // Save changes
    const updatedHabit = await db.Habit.findByIdAndUpdate(
      req.params.id,
      { history: newHistory, streak: updatedStreak },
      { new: true }
    );

    res.json(updatedHabit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/habits/:id
// @desc    Delete a habit
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let habit = await db.Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.userId.toString() !== req.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await db.Habit.findByIdAndDelete(req.params.id);

    res.json({ message: 'Habit removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
