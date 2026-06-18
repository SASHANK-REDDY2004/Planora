const mongoose = require('mongoose');
const jsondb = require('./jsondb');
require('dotenv').config();

const useMongo = process.env.MONGO_URI && process.env.MONGO_URI.trim() !== "";

let db = {};

if (useMongo) {
  console.log('Connecting to MongoDB Atlas...');
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas.'))
    .catch(err => {
      console.error('Error connecting to MongoDB Atlas. Falling back to local JSON database...', err);
      setupLocalDB();
    });

  // Define Mongoose Schemas
  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  }, { timestamps: true });

  const TaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: String }
  }, { timestamps: true });

  const HabitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    history: [{ type: String }], // Array of "YYYY-MM-DD" dates
    streak: { type: Number, default: 0 }
  }, { timestamps: true });

  const MoodSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mood: { type: Number, required: true }, // 1 to 5 scale
    notes: { type: String, default: "" },
    quote: { type: String },
    date: { type: String, required: true } // "YYYY-MM-DD"
  }, { timestamps: true });

  db.User = mongoose.model('User', UserSchema);
  db.Task = mongoose.model('Task', TaskSchema);
  db.Habit = mongoose.model('Habit', HabitSchema);
  db.MoodLog = mongoose.model('MoodLog', MoodSchema);
  db.isMongo = true;

} else {
  console.log('No MONGO_URI specified. Using local JSON database storage.');
  setupLocalDB();
}

function setupLocalDB() {
  const UserColl = jsondb.collection('users');
  const TaskColl = jsondb.collection('tasks');
  const HabitColl = jsondb.collection('habits');
  const MoodColl = jsondb.collection('moods');

  // Add a findById helper to JSON collections to match mongoose syntax
  const wrapCollection = (collection) => {
    return {
      find: (query) => collection.find(query),
      findOne: (query) => collection.findOne(query),
      findById: (id) => collection.findOne({ _id: id }),
      create: (data) => collection.create(data),
      findByIdAndUpdate: (id, update, options) => collection.findByIdAndUpdate(id, update, options),
      findByIdAndDelete: (id) => collection.findByIdAndDelete(id),
      deleteMany: (query) => collection.deleteMany(query)
    };
  };

  db.User = wrapCollection(UserColl);
  db.Task = wrapCollection(TaskColl);
  db.Habit = wrapCollection(HabitColl);
  db.MoodLog = wrapCollection(MoodColl);
  db.isMongo = false;
}

module.exports = db;
