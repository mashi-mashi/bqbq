import {Logger} from '@mashi-mashi/fff/lib/logger/logger';
import {Auth, sheets_v4, google} from 'googleapis';
import {BigQueryClient} from '../infrastructures/bigquery-client';

export class ExportSpreadsheetUsecase {
  private auth: Auth.JWT;
  private sheet: sheets_v4.Sheets;
  private logger = Logger.create('ExportSpreadsheetUsecase');
  private bigquery = new BigQueryClient();

  public static initialize = async (credentials?: {projectId: string; private_key: string; client_email: string}) => {
    const auth = (await google.auth.getClient({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })) as Auth.JWT;
    return new ExportSpreadsheetUsecase(auth);
  };

  private constructor(auth: Auth.JWT) {
    this.auth = auth;
    this.sheet = google.sheets('v4');
  }

  public execute = async ({sql, spreadsheetId, sheetId}: {spreadsheetId: string; sheetId: string; sql: string}) => {
    const values = await this.bigquery.executeQuery(sql);
    this.logger.log(`start exporting to GSS, ${spreadsheetId + ':' + sheetId}`);
    await this.replaceSheet(spreadsheetId, sheetId, values);
    this.logger.log(`finish exporting to GSS, ${spreadsheetId + ':' + sheetId}`);
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
