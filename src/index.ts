import {FirestoreReference, Logger} from '@mashi-mashi/fff/lib';
const logger = Logger.create('log name');

(async () => {
  logger.log('1');
  logger.setPrefix('add prefix');
  logger.log('2');

  const ref = new FirestoreReference('collectionName').collection();
})();
