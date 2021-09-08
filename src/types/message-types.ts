export type BaseMessageType = {
  source: {
    datasetId?: string;
    tableId: string;
    name: string;
    version: 'v1';
  };
  values: {data: any; insertId?: string}[];
  nosave?: boolean;
};
