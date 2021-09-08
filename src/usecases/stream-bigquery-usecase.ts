import {Logger} from '@mashi-mashi/fff/lib/logger/logger';
import {EventContext} from 'firebase-functions/lib/cloud-functions';
import {BigQueryClient} from '../infrastructures/bigquery-client';
import {BaseMessageType} from '../types/message-types';
import {chunk} from '../utils/object-utils';

export class StreamBigQueryUsecase {
  private logger = Logger.create('StreamBigQueryUsecase');
  private bigquery = new BigQueryClient();

  public static initialize = () => {
    return new StreamBigQueryUsecase();
  };

  private constructor() {}

  public execute = async ({values, source}: BaseMessageType, eventContext: EventContext) => {
    const insertRows = values.map((d: {insertId?: string; data: any}) => ({
      insertId: d.insertId,
      json: {
        ...sourceConverter[source.tableId](d.data),
        publishTimestamp: eventContext.timestamp,
        source: source,
        context: {
          eventId: eventContext.eventId,
          eventType: eventContext.eventType,
          resource: {
            service: eventContext.resource?.service,
            name: eventContext.resource.name,
            type: eventContext.resource.type,
          },
        },
      },
    }));

    const datasetId = source.datasetId || 'me__notes';

    const {results, errors} = await this.bigquery.insertRawJsons(datasetId, source.tableId, insertRows);

    if (errors.length) {
      this.logger.error(
        `failed to insert bigqeury. tableId: ${datasetId}.${source.tableId} error counts: ${errors.length}`
      );
      chunk(errors, 10).map((error_part, index) => {
        this.logger.error(`caused by error(tableId: ${datasetId}.${source.tableId} index: ${index})`, error_part);
      });
    }

    return results;
    // await new SlackGateway().insertTable(`${DATASET_ID}.${source.tableId}`, insertRows.length);
  };
}

const sourceConverter = {
  '': (d: any) => ({...d}),
};
