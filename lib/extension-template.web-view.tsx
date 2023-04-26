import papi from "papi";
import React from "react";
import { QuickVerseDataProvider } from "./main";

const { useState } = React;
const {
  react: {
    hooks: { useData, useDataProvider },
    components: { Button },
  },
  logger,
} = papi;

function ExtensionTemplateReact() {
  const [clicks, setClicks] = useState(0);

  const quickVerseDataProvider = useDataProvider<QuickVerseDataProvider>(
    "quick-verse.quick-verse"
  );

  const [latestVerseText] = useData(
    quickVerseDataProvider,
    "latest",
    "Loading latest Scripture text..."
  );

  return (
    <>
      <div>Extension Template React</div>
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
