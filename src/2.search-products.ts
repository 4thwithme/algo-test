import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';

const client = algoliasearch(
  String(process.env.ALG_APP_ID),
  String(process.env.ALG_API_KEY),
);

const search = async () => {
  try {
    for (let i = 0; i < 12; i++) {
      await client.browse({
        indexName: String(process.env.ALG_INDEX_NAME),
        browseParams: {
          query: '',
          hitsPerPage: 10,
          page: i,
        },
      });
    }

    console.log('Successfully get objects from Algolia!');
    return;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  } finally {
    console.log('Algolia connection closed');
  }
};

(async () => {
  await search();
})();
