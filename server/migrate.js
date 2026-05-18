/**
 * Migration script: Copy local MongoDB data to Atlas
 * Usage: node migrate.js
 */
const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/opticalcrm';
const ATLAS_URI = 'mongodb+srv://opticalcrm:PatelKeyur611@trial.zetij38.mongodb.net/opticalcrm?retryWrites=true&w=majority&appName=Trial';

async function migrate() {
  console.log('🔄 Connecting to local MongoDB...');
  const localClient = new MongoClient(LOCAL_URI);
  await localClient.connect();
  const localDb = localClient.db('opticalcrm');

  console.log('🔄 Connecting to MongoDB Atlas...');
  const atlasClient = new MongoClient(ATLAS_URI);
  await atlasClient.connect();
  const atlasDb = atlasClient.db('opticalcrm');

  const collections = await localDb.listCollections().toArray();
  console.log(`\n📦 Found ${collections.length} collections to migrate:\n`);

  for (const col of collections) {
    const name = col.name;
    const docs = await localDb.collection(name).find({}).toArray();
    
    if (docs.length === 0) {
      console.log(`  ⏭️  ${name}: 0 documents (skipped)`);
      continue;
    }

    // Drop existing collection on Atlas to avoid duplicates
    try { await atlasDb.collection(name).drop(); } catch (e) { /* doesn't exist yet */ }

    await atlasDb.collection(name).insertMany(docs);
    console.log(`  ✅ ${name}: ${docs.length} documents migrated`);
  }

  console.log('\n🎉 Migration complete!');
  
  await localClient.close();
  await atlasClient.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
