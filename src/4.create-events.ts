import 'dotenv/config';
import { algoliasearch, EventsItems } from 'algoliasearch';
import { MongoClient } from 'mongodb';

const client = algoliasearch(
  String(process.env.ALG_APP_ID),
  String(process.env.ALG_API_KEY),
);
const insights = client.initInsights({ region: 'de' });

const mongoClient = new MongoClient(String(process.env.MONGO_URI), {
  directConnection: true,
});

const db = mongoClient.db('swag');
const collection = db.collection('prdcts_cp');

const users = [
  'Andrii',
  'Oleksii',
  'Ivan',
  'Martin',
  'John',
  'Jane',
  'Igor',
  'Vlad',
  ...new Array(200).fill(null).map((_, index) => `User${index}`),
];

(async () => {
  const events: Array<EventsItems> = [];
  const now = Date.now();
  const impObjectIds = (
    await collection
      .aggregate([
        { $match: { isSuggested: true } },
        { $project: { objectID: 1 } },
        { $group: { _id: null, objectIDs: { $push: '$objectID' } } },
      ])
      .toArray()
  )[0].objectIDs;

  for (let index = 0; index <= 1000; index++) {
    const products = await collection
      .aggregate([{ $sample: { size: 100 } }])
      .toArray();

    products.forEach((product) => {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomTimeOffset = Math.floor(
        Math.random() * 25 * 24 * 60 * 60 * 1000,
      );

      const objectIDs = [product.objectID];
      objectIDs.push(
        Math.random() < 0.4
          ? products[Math.floor(Math.random() * products.length)].objectID
          : impObjectIds[Math.floor(Math.random() * impObjectIds.length)],
      );

      if (Math.random() < 0.3) {
        objectIDs.push(
          Math.random() < 0.4
            ? products[Math.floor(Math.random() * products.length)].objectID
            : impObjectIds[Math.floor(Math.random() * impObjectIds.length)],
        );
      }

      events.push({
        eventName: 'Product Viewed',
        eventType: 'view',
        index: String(process.env.ALG_INDEX_NAME),
        userToken: randomUser,
        authenticatedUserToken: randomUser,
        timestamp: now - randomTimeOffset,
        objectIDs,
      });

      if (Math.random() < 0.3) {
        events.push({
          eventName: 'Product Clicked',
          eventType: 'click',
          index: String(process.env.ALG_INDEX_NAME),
          userToken: randomUser,
          authenticatedUserToken: randomUser,
          timestamp: now - randomTimeOffset,
          objectIDs,
        });

        if (Math.random() < 0.3) {
          events.push({
            eventName: 'Product Added to Cart',
            eventType: 'conversion',
            eventSubtype: 'addToCart',
            index: String(process.env.ALG_INDEX_NAME),
            userToken: randomUser,
            authenticatedUserToken: randomUser,
            timestamp: now - randomTimeOffset,
            objectIDs,
          });

          if (Math.random() < 0.4) {
            events.push({
              eventName: 'Product Purchased',
              eventType: 'conversion',
              eventSubtype: 'purchase',
              index: String(process.env.ALG_INDEX_NAME),
              userToken: randomUser,
              authenticatedUserToken: randomUser,
              timestamp: now - randomTimeOffset,
              objectIDs,
            });
          }
        }
      }
    });

    // eslint-disable-next-line no-console
    console.log('Added', index + 1);
  }

  console.log('----------DB SAMPLING FINISHED------------');

  // eslint-disable-next-line no-console
  console.log('events', events);

  const batchSize = 1000;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    await insights.pushEvents({ events: batch });
    console.log(
      `Sent batch ${i / batchSize + 1} of ${Math.ceil(events.length / batchSize)}`,
    );
  }

  console.log(`Generated and sent ${events.length} events`);
  await mongoClient.close();
})();
