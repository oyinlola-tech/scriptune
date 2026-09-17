import { parseArgs } from "node:util";
import { runImportBibleJob } from "./importBible/index.js";
import { runImportCrossReferencesJob } from "./importCrossReferences/index.js";
import { runImportHymnalJob } from "./importHymnal/index.js";
import { runImportHymnsJob } from "./importHymns/index.js";
import { runLinkScripturesJob } from "./linkScriptures/index.js";

const USAGE = `Usage: node --import tsx src/jobs/jobs.cli.ts <job> [options]

Jobs:
  import:bible   Import a Bible translation (--translation KJV|AKJV|ASV|WEB|WEBC|DRC|YCB, or --all; --file <path> | --url <url>)
  import:xrefs   Import verse cross-references from OpenBible.info (--file <path> | --url <url>)
  import:hymns   Import Sacred Songs and Solos (--file <path> | --url <url>)
  import:hymnal  Import any hymnal from a JSON file (--file <path>); carries its own rights status
  link:scriptures  Find where the English hymns quote the King James Version (run after importing hymns)
`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    file: { type: "string" },
    url: { type: "string" },
    translation: { type: "string" },
    all: { type: "boolean" },
  },
});

const job = positionals[0];

switch (job) {
  case "import:bible": {
    await runImportBibleJob({
      ...(values.file === undefined ? {} : { file: values.file }),
      ...(values.url === undefined ? {} : { url: values.url }),
      ...(values.translation === undefined ? {} : { translation: values.translation }),
      ...(values.all === undefined ? {} : { all: values.all }),
    });
    break;
  }
  case "import:xrefs": {
    await runImportCrossReferencesJob({
      ...(values.file === undefined ? {} : { file: values.file }),
      ...(values.url === undefined ? {} : { url: values.url }),
    });
    break;
  }
  case "import:hymnal": {
    if (values.file === undefined) {
      process.stderr.write("import:hymnal requires --file <path to hymnal JSON>\n");
      process.exit(1);
    }
    await runImportHymnalJob({ file: values.file });
    break;
  }
  case "link:scriptures": {
    await runLinkScripturesJob();
    break;
  }
  case "import:hymns": {
    await runImportHymnsJob({
      ...(values.file === undefined ? {} : { file: values.file }),
      ...(values.url === undefined ? {} : { url: values.url }),
    });
    break;
  }
  default: {
    process.stderr.write(USAGE);
    process.exit(job === undefined ? 0 : 1);
  }
}
