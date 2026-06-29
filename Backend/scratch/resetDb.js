const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function reset() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-study-assistant';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected.');

    const collections = ['documents', 'flashcardsets', 'quizzes', 'chatsessions', 'vectorchunks'];
    for (const c of collections) {
      try {
        await mongoose.connection.db.dropCollection(c);
        console.log(`Dropped collection: ${c}`);
      } catch (e) {
        console.log(`Collection ${c} did not exist or could not be dropped`);
      }
    }

    console.log('Reset complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

reset();
