import {PubSub} from '@google-cloud/pubsub';

export class PubsubApi {
  private client: PubSub;

  constructor(credentials?: {projectId?: string; private_key?: string; client_email?: string}) {
    this.client = new PubSub(
      credentials
        ? {
            projectId: credentials?.projectId,
            credentials,
          }
        : undefined
    );
  }

  public publishJSON = async ({topicName, json}: {topicName: string; json: object}) => {
    const topic = this.client.topic(topicName);
    const res = await topic.publishJSON(json);

    return res;
  };
}
