import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';
import { MongoClient } from 'mongodb';

const client = algoliasearch(
  String(process.env.ALG_APP_ID),
  String(process.env.ALG_API_KEY),
);

const mongoClient = new MongoClient(String(process.env.MONGO_URI), {
  directConnection: true,
});

const db = mongoClient.db('swag');
const collection = db.collection('prdcts_cp');

const processRecords = async () => {
  try {
    const products = await collection.find().toArray();

    await client.saveObjects({
      indexName: String(process.env.ALG_INDEX_NAME),
      objects: products,
    });

    console.log('Successfully indexed objects from MongoDB to Algolia!');
    return;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  } finally {
    await mongoClient.close();
    console.log('MongoDB connection closed');
  }
};

(async () => {
  await processRecords();
})();
