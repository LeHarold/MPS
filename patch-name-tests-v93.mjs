import fs from 'node:fs';const p='run-checks.mjs';fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace("'test-v87.mjs'", "'test-v87.mjs','test-v93.mjs'"));
