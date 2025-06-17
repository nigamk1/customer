const fs = require('fs');
const path = require('path');

/**
 * A simple in-memory vector database with persistence
 */
class SimpleVectorDb {
  constructor(options = {}) {
    this.path = options.path || path.join(__dirname, '../data/vector_db/vectors.json');
    this.dimensions = options.dimensions || 1536;
    this.vectors = [];
    this.loaded = false;
    
    // Ensure directory exists
    const dir = path.dirname(this.path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Try to load existing data
    this.load();
  }
  
  /**
   * Load vectors from disk
   */
  load() {
    try {
      if (fs.existsSync(this.path)) {
        const data = fs.readFileSync(this.path, 'utf8');
        this.vectors = JSON.parse(data);
        this.loaded = true;
      } else {
        this.vectors = [];
        this.loaded = true;
      }
    } catch (error) {
      console.error('Error loading vector database:', error);
      this.vectors = [];
      this.loaded = true;
    }
  }
  
  /**
   * Save vectors to disk
   */
  save() {
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.vectors), 'utf8');
    } catch (error) {
      console.error('Error saving vector database:', error);
    }
  }
  
  /**
   * Insert or update a vector
   * @param {Object} entry - Vector entry with id, values, and metadata
   */
  async upsert(entry) {
    if (!entry.id || !entry.values) {
      throw new Error('Vector entry must have id and values');
    }
    
    // Ensure vector has correct dimensions
    if (entry.values.length !== this.dimensions) {
      throw new Error(`Vector must have ${this.dimensions} dimensions`);
    }
    
    // Find existing vector with same id
    const index = this.vectors.findIndex(v => v.id === entry.id);
    
    if (index >= 0) {
      // Update existing
      this.vectors[index] = {
        ...this.vectors[index],
        ...entry
      };
    } else {
      // Insert new
      this.vectors.push(entry);
    }
    
    // Save to disk
    this.save();
    return entry.id;
  }
  
  /**
   * Delete a vector by id
   * @param {string} id - Vector id
   */
  async delete(id) {
    const initialLength = this.vectors.length;
    this.vectors = this.vectors.filter(v => v.id !== id);
    
    // Save to disk if something was deleted
    if (this.vectors.length !== initialLength) {
      this.save();
      return true;
    }
    
    return false;
  }
  
  /**
   * Get all vectors
   * @returns {Array} All vectors
   */
  async getAll() {
    return this.vectors;
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} a - First vector
   * @param {Array} b - Second vector
   * @returns {number} Similarity score (0-1)
   */
  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    
    const similarity = dotProduct / (magA * magB);
    
    // Handle potential numerical issues
    if (isNaN(similarity)) return 0;
    
    return similarity;
  }
  
  /**
   * Search for similar vectors
   * @param {Object} options - Search options with values and limit
   * @returns {Array} Similar vectors with scores
   */
  async search(options) {
    if (!options.values) {
      throw new Error('Search requires values');
    }
    
    // Ensure query vector has correct dimensions
    if (options.values.length !== this.dimensions) {
      throw new Error(`Query vector must have ${this.dimensions} dimensions`);
    }
    
    // Calculate similarity for all vectors
    const results = this.vectors.map(vector => {
      const score = this.cosineSimilarity(options.values, vector.values);
      return {
        ...vector,
        score
      };
    });
    
    // Sort by similarity (highest first)
    results.sort((a, b) => b.score - a.score);
    
    // Limit results
    const limit = options.limit || 10;
    return results.slice(0, limit);
  }
}

module.exports = SimpleVectorDb;
