import {Logger} from '@mashi-mashi/fff/lib';
import {google, sheets_v4, Auth} from 'googleapis';
import {BigQueryApi} from '../infrastructures/bigquery-api';

const logger = Logger.create('[ImportService]');
export class ImportService {
  private auth: Auth.JWT;
  private sheet: sheets_v4.Sheets;

  private constructor(auth: Auth.JWT) {
    this.auth = auth;
    this.sheet = google.sheets('v4');
  }

  public static initialize = async (credentials?: {projectId: string; private_key: string; client_email: string}) => {
    const auth = (await google.auth.getClient({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })) as Auth.JWT;
    return new ImportService(auth);
  };

  public import = async ({sql, spreadsheetId, sheetId}: {spreadsheetId: string; sheetId: string; sql: string}) => {
    const values = await new BigQueryApi().executeQuery(sql);
    logger.log(`start exporting to GSS, ${spreadsheetId + ':' + sheetId}`);
    await this.replaceSheet(spreadsheetId, sheetId, values);
    logger.log(`finish exporting to GSS, ${spreadsheetId + ':' + sheetId}`);
  };

  private clearSheet = async (spreadsheetId: string, sheetId: string) => {
    return await this.sheet.spreadsheets.values.clear({auth: this.auth, spreadsheetId, range: sheetId});
  };

  private replaceSheet = async (spreadsheetId: string, sheetId: string, values: any[]) => {
    await this.clearSheet(spreadsheetId, sheetId);
    await this.sheet.spreadsheets.values.update({
      auth: this.auth,
      spreadsheetId,
      range: sheetId,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [Object.keys(values[0]), ...values.map(Object.values)],
      },
    });
  };
}
