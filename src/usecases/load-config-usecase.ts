import {Logger} from '@mashi-mashi/fff/lib/logger/logger';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import {PubsubClient} from '../infrastructures/pubsub-client';

const DIR_NAME = './templates/';

export class LoadConfigUsecase {
  private pubsub = new PubsubClient();
  private logger = Logger.create('LoadConfigUsecase');
  private constructor() {}

  public static initialize = () => {
    return new LoadConfigUsecase();
  };

  public execute = async () => {
    const files = fs.readdirSync(DIR_NAME);
    this.logger.log('files', files);

    const messages = this.validateYamlFile(files)
      .map(file => {
        const readYaml = this.loadYamlFile(DIR_NAME + '/' + file);
        const {sql, spreadsheetId, sheetId, skip, description} = readYaml;
        if (!sql || !spreadsheetId || !sheetId || skip) return;

        return {
          sql,
          spreadsheetId,
          sheetId,
          skip,
          description,
        };
      })
      .filter((m): m is Exclude<typeof m, undefined> => !!m);

    const r = await Promise.all(
      messages.map(message =>
        this.publishJSON({
          topicName: 'import-bigquery-values',
          message: message,
        })
          .then(r =>
            this.logger.log(
              `Successed to publish-message. sheetId: ${message.sheetId} description: ${message.description}`
            )
          )
          .catch(e => this.logger.warn(`Failed to pubsish messages`, message, e))
      )
    );

    this.logger.log(`All exports have been completed.`);
  };

  private publishJSON = async ({topicName, message}: {topicName: string; message: object}) => {
    return await this.pubsub.publishJSON({topicName, json: message});
  };

  private loadYamlFile = (filename: string) => {
    const yamlText = fs.readFileSync(filename, {encoding: 'utf8'});
    return yaml.load(yamlText) as {
      description: string;
      sql: string;
      sheetId: string;
      spreadsheetId: string;
      skip?: boolean;
    };
  };

  private validateYamlFile = (files: string[]) => {
    // スペース以外の文字で始まって「.yaml」「.yml」で終わる文字(大文字・小文字を区別しない[i])
    const reg = new RegExp('([^s]+(\\.(yaml|yml))$)', 'i');
    return files.filter(file => reg.test(file));
  };
}
