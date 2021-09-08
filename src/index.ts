import {Logger} from '@mashi-mashi/fff/lib/logger/logger';
import * as dotenv from 'dotenv';
import * as functions from 'firebase-functions';
import {EventContext} from 'firebase-functions';
import {Message} from 'firebase-functions/lib/providers/pubsub';
import {PubsubClient} from './infrastructures/pubsub-client';
import {ExportSpreadsheetUsecase} from './usecases/export-spreadsheet-usecase';
import {LoadConfigUsecase} from './usecases/load-config-usecase';

dotenv.config();

export const scheduledQuery = functions.pubsub
  ._scheduleWithOptions('0 10 * * *', {
    memory: '2GB',
    timeoutSeconds: 540,
  })
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    await LoadConfigUsecase.initialize().execute();
  });

export const exporter = functions.pubsub
  .topic('import-bigquery-values')
  .onPublish(async (message: Message, _context: EventContext) => {
    _context.timestamp;
    const logger = Logger.create('importer');
    const {sheetId, spreadsheetId, sql} = new PubsubClient().parseMessage<{
      sql: string;
      spreadsheetId: string;
      sheetId: string;
    }>(message.data);

    if (!sheetId || !spreadsheetId || !sql) {
      logger.error('require-params');
      return;
    }
    const usecase = await ExportSpreadsheetUsecase.initialize();
    await usecase.execute({sql, spreadsheetId, sheetId});
  });
