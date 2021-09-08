export const chunk = <T extends any[]>(arr: T, size: number): T[] => {
  return arr.reduce((newarr, _, i) => (i % size ? newarr : [...newarr, arr.slice(i, i + size)]), []);
};

export const deepDeleteUndefined = (data: Record<string, any>) => {
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) {
      delete data[k];
    } else if (v instanceof Array) {
      for (const val of v) {
        deepDeleteUndefined(val);
      }
    } else if (v instanceof Object) {
      if (!Object.keys(v).length) {
        delete data[k];
      }
      deepDeleteUndefined(v);
    }
  }
  return data;
};
