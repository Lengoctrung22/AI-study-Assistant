const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { searchChunks } = require('../services/embeddingService');
const mongoose = require('mongoose');

async function test() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-study-assistant';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected.');

    // Find the uploaded document
    const Document = require('../models/Document');
    const doc = await Document.findOne({ title: 'sample' });
    if (!doc) {
      console.error('No sample document found!');
      process.exit(1);
    }
    console.log('Found document:', doc._id);

    console.log('Searching for "dummy"...');
    const results = await searchChunks('dummy', doc._id, 3);
    console.log('Search Results:', results);

    process.exit(0);
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  }
}

test();
