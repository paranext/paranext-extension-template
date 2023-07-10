import papi from "papi-frontend";
import { useState } from "react";
import { ExtensionVerseDataProvider, ExtensionVerseDataTypes } from "paranext-extension-template";
import { Button } from "papi-components";
import { QuickVerseDataTypes } from "quick-verse";

const {
  react: {
    hooks: { useData, useDataProvider },
  },
  logger,
} = papi;

globalThis.webViewComponent = function () {
  const [clicks, setClicks] = useState(0);

  const extensionVerseDataProvider = useDataProvider<ExtensionVerseDataProvider>(
    "paranextExtensionTemplate.quickVerse"
  );

  const [latestExtensionVerseText] = useData.Verse<ExtensionVerseDataTypes, 'Verse'>(
    extensionVerseDataProvider,
    "latest",
    "Loading latest Scripture text from extension template..."
  );

  const [latestQuickVerseText] = useData.Verse<QuickVerseDataTypes, 'Verse'>(
    'quickVerse.quickVerse',
    "latest",
    "Loading latest Scripture text from extension template..."
  );

  return (
    <>
      <div className="title">Extension Template <span className="framework">React</span></div>
      <div>{latestExtensionVerseText}</div>
      <div>{latestQuickVerseText}</div>
      <div>
        <Button
          onClick={async () => {
            const start = performance.now();
            const result = await papi.commands.sendCommand(
              "extensionTemplate.doStuff",
              "Extension Template React Component"
            );
            setClicks((currentClicks) => currentClicks + 1);
            logger.info(
              `command:extensionTemplate.doStuff '${result}' took ${
                performance.now() - start
              } ms`
            );
          }}
        >
          Hi {clicks}
        </Button>
      </div>
    </>
  );
}
