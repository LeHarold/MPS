import {spawnSync} from 'node:child_process';
const checks=['test-workspace.mjs','test-coordinates.mjs','test-data.mjs','test-v10.mjs','test-v17.mjs','test-v23.mjs','test-v26.mjs','test-v28.mjs','test-v30.mjs','test-v32.mjs','test-v47.mjs','test-v66.mjs','test-v79.mjs','test-v87.mjs','test-v93.mjs','test-v97.mjs','test-merge-v102.mjs','test-point-colors-v104.mjs','test-mom-v106.mjs','test-editing-v109.mjs','test-pinch-v113.mjs'];
for(const file of checks){const result=spawnSync(process.execPath,[file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}
console.log('PASS all '+checks.length+' test suites');


