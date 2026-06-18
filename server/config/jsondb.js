const fs = require('fs');
const path = require('path');

// Ensure database directory exists
const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

class Collection {
  constructor(name) {
    this.filePath = path.join(DB_DIR, `${name}.json`);
    this.name = name;
  }

  // Load data from file
  _read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
        return [];
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (error) {
      console.error(`Error reading database file for collection ${this.name}:`, error);
      return [];
    }
  }

  // Save data to file
  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing database file for collection ${this.name}:`, error);
      return false;
    }
  }

  // Match query helper
  _match(item, query) {
    for (const key in query) {
      if (query[key] !== item[key]) {
        return false;
      }
    }
    return true;
  }

  // Generate unique ID
  _generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Find all items matching a query
  async find(query = {}) {
    const items = this._read();
    if (Object.keys(query).length === 0) return items;
    return items.filter(item => this._match(item, query));
  }

  // Find one item matching a query
  async findOne(query = {}) {
    const items = this._read();
    return items.find(item => this._match(item, query)) || null;
  }

  // Insert a new item
  async create(data) {
    const items = this._read();
    const newItem = {
      _id: this._generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newItem);
    this._write(items);
    return newItem;
  }

  // Find by ID and update
  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;

    const currentItem = items[index];
    
    // Check if we are updating nested properties or replacing
    const updatedItem = {
      ...currentItem,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    items[index] = updatedItem;
    this._write(items);
    return updatedItem;
  }

  // Find by ID and delete
  async findByIdAndDelete(id) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;

    const deletedItem = items[index];
    const filteredItems = items.filter(item => item._id !== id);
    this._write(filteredItems);
    return deletedItem;
  }

  // Delete multiple items
  async deleteMany(query = {}) {
    const items = this._read();
    const remaining = items.filter(item => !this._match(item, query));
    this._write(remaining);
    return { deletedCount: items.length - remaining.length };
  }
}

// Export a function that returns a collection instance (like mongoose.model)
const db = {
  collection: (name) => new Collection(name)
};

module.exports = db;
