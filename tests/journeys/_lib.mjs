/** What every journey file shares: a step that fails says so through `must`, and the harness reads `Failed`. */
export class Failed extends Error {}
export const must = (ok, what) => { if (!ok) throw new Failed(what); };
