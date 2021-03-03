import {BigQuery} from '@google-cloud/bigquery';
import {HttpError, HttpStatusCode, Logger} from '@mashi-mashi/fff/lib';

const logger = Logger.create('[GcpBigQuery]');

const MAXIMUM_EXECUTION_AMOUNT_YEN = 5;

export class BigQueryHelper {
  private client: BigQuery;
  constructor({
    projectId,
    creadentials,
  }: {
    projectId: string;
    creadentials?: {private_key: string; client_email: string};
  }) {
    this.client = new BigQuery({
      projectId: projectId,
      credentials: creadentials,
    });
  }

  /**
   * はじめに実行計画を行ってから実行
   * @param sql
   * @param params
   */
  public executeQuery = async <T extends {id?: string}>(sql: string, params?: {[param: string]: any}): Promise<T[]> => {
    const [, res] = await this.client.createQueryJob({query: sql, dryRun: true});
    const yen = this.billedAsYen(res.statistics?.totalBytesProcessed);
    logger.log('見積もり(円):', yen);

    // 見積もり失敗か5円以上かかるならエラー
    if (!yen || yen > MAXIMUM_EXECUTION_AMOUNT_YEN) {
      throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'query-cost-is-too-high');
    }

    const result = await this.client.query({query: sql, params}).catch(e => {
      logger.error('failed to execute query', e);
      throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'failed-to-execute-query');
    });

    return result[0] as T[];
  };

  private billedAsYen = (bytesProcessed?: string | number) => {
    if (!bytesProcessed) return;
    const minBytesBilled: number = 1024 * 1024 * 10;
    const bytes: number = minBytesBilled > Number(bytesProcessed) ? minBytesBilled : Number(bytesProcessed);
    const bytesAsTeraBytes: number = bytes / 1024 / 1024 / 1024 / 1024;
    return (bytesAsTeraBytes / 1) /* TB */ * 5 /* $ */ * 113; /* 円(ドル円相場) */
  };
}
