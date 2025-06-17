const { OpenAI } = require('openai');
const SimpleVectorDb = require('../utils/SimpleVectorDb');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client for embeddings
const apiKey = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.replace(/^"(.*)"$/, '$1') : '';
const openai = new OpenAI({ apiKey });

// Create or connect to a simple vector database
const vectorDbPath = path.join(__dirname, '../data/vector_db/vectors.json');
if (!fs.existsSync(path.dirname(vectorDbPath))) {
  fs.mkdirSync(path.dirname(vectorDbPath), { recursive: true });
}

const vectorDb = new SimpleVectorDb({
  path: vectorDbPath,
  dimensions: 1536, // OpenAI embeddings dimension
});

/**
 * Generate embeddings for text using OpenAI API
 * 
 * @param {string} text - The text to generate embeddings for
 * @returns {Promise<number[]>} - The embedding vector
 */
async function generateEmbedding(text) {
  try {
    if (!text || text.trim() === '') {
      throw new Error('No text provided for embedding generation');
    }

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.slice(0, 8000), // API limit is around 8191 tokens
    });

    return embeddingResponse.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Chunk text into smaller segments for better embeddings
 * 
 * @param {string} text - The text to chunk
 * @param {number} chunkSize - The size of each chunk
 * @param {number} overlap - The overlap between chunks
 * @returns {Array<{text: string, index: number}>} - Array of chunked text with indices
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  
  // Simple chunking by character count with overlap
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    const chunk = text.slice(i, i + chunkSize);
    if (chunk) {
      chunks.push({
        text: chunk,
        index: i,
      });
    }
  }
  
  return chunks;
}

/**
 * Add document to vector database
 * 
 * @param {string} integrationId - ID of the integration
 * @param {string} documentId - ID of the document 
 * @param {string} text - Text content to index
 * @param {Object} metadata - Metadata about the document
 * @returns {Promise<Array<string>>} - Array of chunk IDs
 */
async function addDocumentToVectorDb(integrationId, documentId, text, metadata = {}) {
  try {
    // Create chunks from the text
    const chunks = chunkText(text);
    const chunkIds = [];
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${integrationId}_${documentId}_${i}`;
      
      // Generate embedding for chunk
      const embedding = await generateEmbedding(chunk.text);
      
      // Store in vector database
      await vectorDb.upsert({
        id: chunkId,
        values: embedding,
        metadata: {
          ...metadata,
          integrationId,
          documentId,
          chunkIndex: i,
          text: chunk.text,
        }
      });
      
      chunkIds.push(chunkId);
    }
    
    return chunkIds;
  } catch (error) {
    console.error('Error adding document to vector database:', error);
    throw error;
  }
}

/**
 * Remove document from vector database
 * 
 * @param {string} integrationId - ID of the integration
 * @param {string} documentId - ID of the document
 */
async function removeDocumentFromVectorDb(integrationId, documentId) {
  try {
    // Get all vectors with matching prefix
    const prefix = `${integrationId}_${documentId}_`;
    const entriesToDelete = await vectorDb.getAll().filter(entry => 
      entry.id.startsWith(prefix)
    );
    
    // Delete each entry
    for (const entry of entriesToDelete) {
      await vectorDb.delete(entry.id);
    }
    
    return entriesToDelete.length;
  } catch (error) {
    console.error('Error removing document from vector database:', error);
    throw error;
  }
}

/**
 * Search for relevant documents
 * 
 * @param {string} integrationId - ID of the integration to search within
 * @param {string} query - Search query
 * @param {number} limit - Max number of results to return
 * @returns {Promise<Array>} - Relevant document chunks
 */
async function searchVectorDb(integrationId, query, limit = 5) {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    // Perform similarity search
    const results = await vectorDb.search({ 
      values: queryEmbedding,
      limit: limit
    });
    
    // Filter results by integrationId
    const filteredResults = results.filter(
      result => result.metadata.integrationId === integrationId
    );
    
    return filteredResults;
  } catch (error) {
    console.error('Error searching vector database:', error);
    throw error;
  }
}

module.exports = {
  generateEmbedding,
  addDocumentToVectorDb,
  removeDocumentFromVectorDb,
  searchVectorDb,
  chunkText
};
