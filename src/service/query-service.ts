import {Logger} from '@mashi-mashi/fff/lib';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import {BigQueryApi} from '../infrastructures/bigquery-api';
import {PubsubApi} from '../infrastructures/pubsub-api';

const DIR_NAME = './templates/';

const logger = Logger.create('[QueryExporterService]');

export class QueryService {
  private bq: BigQueryApi;
  private pubsub: PubsubApi;
  private constructor({bq, pubsub}: {bq: BigQueryApi; pubsub: PubsubApi}) {
    this.bq = bq;
    this.pubsub = pubsub;
  }

  public static initialize = async (credentials?: {projectId: string; private_key: string; client_email: string}) => {
    return new QueryService({
      bq: new BigQueryApi(credentials),
      pubsub: new PubsubApi(),
    });
  };

  public execute = async () => {
    const files = fs.readdirSync(DIR_NAME);
    logger.log('files', files);

    await Promise.all(
      this.selectYamlFile(files).map(async file => {
        try {
          const readYaml = this.loadYamlFile(DIR_NAME + '/' + file);
          const {sql, spreadsheetId, sheetId, skip, description} = readYaml;

          if (!sql || !spreadsheetId || !sheetId || skip) return;
          await this.pubsub.publishJSON({
            topicName: 'import-bigquery-values',
            json: {
              sql,
              spreadsheetId,
              sheetId,
              skip,
              description,
            },
          });
        } catch (e) {
          logger.error('Failed to export sheet', e?.message);
        }
      })
    );

    logger.log(`All exports have been completed.`);
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

  private selectYamlFile = (files: string[]) => {
    // スペース以外の文字で始まって「.yaml」「.yml」で終わる文字(大文字・小文字を区別しない[i])
    const reg = new RegExp('([^s]+(\\.(yaml|yml))$)', 'i');
    return files.filter(file => reg.test(file));
  };
}
