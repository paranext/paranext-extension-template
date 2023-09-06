import papi from 'papi-frontend';
import { useCallback, useState } from 'react';
import type {
  DoStuffEvent,
  ExtensionVerseDataProvider,
  ExtensionVerseDataTypes,
} from 'paranext-extension-template';
import { Button } from 'papi-components';
import type { QuickVerseDataTypes } from 'quick-verse';

const {
  react: {
    hooks: { useData, useDataProvider, useEvent },
  },
  logger,
} = papi;

globalThis.webViewComponent = function ExtensionTemplate2() {
  const [clicks, setClicks] = useState(0);

  useEvent<DoStuffEvent>(
    'extensionTemplate.doStuff',
    useCallback(({ count }) => setClicks(count), []),
  );

  const extensionVerseDataProvider = useDataProvider<ExtensionVerseDataProvider>(
    'paranextExtensionTemplate.quickVerse',
  );

  const [latestExtensionVerseText] = useData.Verse<ExtensionVerseDataTypes, 'Verse'>(
    extensionVerseDataProvider,
    'latest',
    'Loading latest Scripture text from extension template...',
  );

  const [latestQuickVerseText] = useData.Verse<QuickVerseDataTypes, 'Verse'>(
    'quickVerse.quickVerse',
    'latest',
    'Loading latest Scripture text from extension template...',
  );

  return (
    <>
      <div className="title">
        Extension Template <span className="framework">React 2</span>
      </div>
      <div>{latestExtensionVerseText}</div>
      <div>{latestQuickVerseText}</div>
      <div>
        <Button
          onClick={async () => {
            const start = performance.now();
            const result = await papi.commands.sendCommand(
              'extensionTemplate.doStuff',
              'Extension Template React Component',
            );
            setClicks(clicks + 1);
            logger.info(
              `command:extensionTemplate.doStuff '${result.response}' took ${
                performance.now() - start
              } ms`,
            );
          }}
        >
          Hi {clicks}
        </Button>
      </div>
    </>
  );
};
