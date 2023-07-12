import type { DataProviderDataType } from "shared/models/data-provider.model";
import type IDataProvider from "shared/models/data-provider.interface";

declare module 'paranext-extension-template' {
  export type ExtensionVerseSetData = string | { text: string; isHeresy: boolean };

  export type ExtensionVerseDataTypes = {
    Verse: DataProviderDataType<string, string | undefined, ExtensionVerseSetData>;
    Heresy: DataProviderDataType<string, string | undefined, string>;
    Chapter: DataProviderDataType<
      [book: string, chapter: number],
      string | undefined,
      never
    >;
  };

  export type ExtensionVerseDataProvider = IDataProvider<ExtensionVerseDataTypes>;
}

declare module "papi-commands" {
  export interface CommandHandlers {
    "extensionTemplate.doStuff": (message: string) => string;
  }
}

