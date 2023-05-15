import papi from "papi";
import { useState } from "react";
import { QuickVerseDataProvider } from "extension-types";

const {
  react: {
    hooks: { useData, useDataProvider },
    components: { Button },
  },
  logger,
} = papi;

globalThis.webViewComponent = function() {
  const [clicks, setClicks] = useState(0);

  const quickVerseDataProvider = useDataProvider<QuickVerseDataProvider>(
    "paranext-extension-template.quick-verse"
  );

  const [latestVerseText] = useData(
    quickVerseDataProvider,
    "latest",
    "Loading latest Scripture text..."
  );

  return (
    <>
      <div className="title">Extension Template <span className="framework">React</span></div>
      <div>{latestVerseText}</div>
      <div>
        <Button
          onClick={async () => {
            const start = performance.now();
            const result = await papi.commands.sendCommand(
              "extension-template.do-stuff",
              "Extension Template React Component"
            );
            setClicks((currentClicks) => currentClicks + 1);
            logger.info(
              `command:extension-template.do-stuff '${result}' took ${
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
