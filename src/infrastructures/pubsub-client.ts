import {PubSub} from '@google-cloud/pubsub';
import {Logger} from '@mashi-mashi/fff/lib/logger/logger';
import {BaseMessageType} from '../types/message-types';

const chunk = <T extends any[]>(arr: T, size: number): T[] => {
  return arr.reduce((newarr, _, i) => (i % size ? newarr : [...newarr, arr.slice(i, i + size)]), []);
};

export class PubsubClient {
  private client: PubSub;
  private logger: Logger;

  constructor(
    credentials?: {projectId?: string; private_key?: string; client_email?: string},
    context?: {logger: Logger}
  ) {
    this.client = new PubSub(
      credentials
        ? {
            projectId: credentials?.projectId,
            credentials,
          }
        : undefined
    );
    this.logger = context?.logger || Logger.create('pubsub');
  }

  public publishBaseMessage = async <T extends BaseMessageType>({topicName, json}: {topicName: string; json: T}) => {
    if (!json.values?.length) {
      return;
    }

    const topic = this.client.topic(topicName);

    const reqs = chunk(json.values, 200).map(array => ({
      source: json.source,
      values: array,
    }));

    const res = await Promise.all(reqs.map(req => topic.publishJSON(req)));

    return res;
  };

  public publishJSON = async ({topicName, json}: {topicName: string; json: object}) => {
    const topic = this.client.topic(topicName);
    const res = await topic.publishJSON(json);

    return res;
  };

  public parseMessage = <T>(d: string): T => {
    return JSON.parse(Buffer.from(d, 'base64').toString());
  };
}
