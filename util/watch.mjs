// Author: Kaura Peura

import { exec } from 'child_process';
import { watch } from 'chokidar';
import { promisify } from 'util';

const Constants = {
  TryBuildInterval: 200,
};

let buildActive = false;
let buildPending = true;

async function tryBuild() {
  if (!buildPending || buildActive) {
    return;
  }

  try {
    buildActive = true;
    buildPending = false;
    const { stdout, stderr } = await promisify(exec)('./build.sh');
    if (stderr !== '') { console.error(stderr); }
    if (stdout !== '') { console.log(stdout); }
    buildActive = false;
  } catch (err) {
    console.error(`Build failed: ${err.message}`);
    process.exit(1);
  }
}

watch('./src').on('all', () => { buildPending = true; });
setInterval(tryBuild, Constants.TryBuildInterval);
