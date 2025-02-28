import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';
import { MongoClient, ObjectId } from 'mongodb';

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
    for (let i = 0; i <= 7; i++) {
      const res = await client.browse<{ _id: string }>({
        indexName: String(process.env.ALG_INDEX_NAME),
        browseParams: {
          query: '',
          hitsPerPage: 1000,
          page: i,
        },
      });

      // eslint-disable-next-line no-console
      console.log('res', res.hits.length);

      for await (const hit of res.hits) {
        await collection.updateOne(
          { _id: new ObjectId(String(hit._id!)) },
          { $set: { objectID: hit.objectID } },
        );
      }

      // eslint-disable-next-line no-console
      console.log('done');
    }
  } catch (err) {
    console.error('Error:', err);
    throw err;
  } finally {
    await mongoClient.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
};

(async () => {
  await processRecords();
})();
