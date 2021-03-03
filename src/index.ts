import {Logger} from '@mashi-mashi/fff/lib';
import * as dotenv from 'dotenv';
import * as functions from 'firebase-functions';
import {EventContext} from 'firebase-functions';
import {Message} from 'firebase-functions/lib/providers/pubsub';
import {ImportService} from './service/import-service';
import {MessagingService} from './service/messaging-service';

dotenv.config();
const logger = Logger.create('index');

export const scheduledQuery = functions.pubsub
  ._scheduleWithOptions('0 10 * * *', {
    memory: '2GB',
    timeoutSeconds: 540,
  })
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const messanger = await MessagingService.initialize();
    await messanger.execute();
  });

export const importer = functions.pubsub
  .topic('import-bigquery-values')
  .onPublish(async (message: Message, _context: EventContext) => {
    const {sheetId, spreadsheetId, sql} = JSON.parse(Buffer.from(message.data, 'base64').toString()) as {
      sql: string;
      spreadsheetId: string;
      sheetId: string;
    };

    if (!sheetId || !spreadsheetId || !sql) {
      logger.log('require-params');
      return;
    }
    const importer = await ImportService.initialize();
    await importer.import({sheetId, spreadsheetId, sql});
  });
