import type IDataProvider from "shared/models/data-provider.interface";

export type QuickVerseSetData = string | { text: string; isHeresy: boolean };

export interface QuickVerseDataProvider
  extends IDataProvider<string, string, QuickVerseSetData> {
  setHeresy(verseRef: string, verseText: string): Promise<boolean>;
}
