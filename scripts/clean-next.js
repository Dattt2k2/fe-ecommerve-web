// scripts/clean-next.js
// Attempts to remove .next/trace or related files before building to avoid EPERM on Windows
const fs = require('fs');
const path = require('path');

const targets = [path.join(process.cwd(), '.next', 'trace'), path.join(process.cwd(), '.next', 'trace.json')];

function tryUnlink(target) {
  if (!fs.existsSync(target)) return;
  try {
    fs.unlinkSync(target);
    console.log('[clean-next] Deleted:', target);
  } catch (err) {
    // If permission error, try to change mode then unlink
    if (err && (err.code === 'EPERM' || err.code === 'EACCES')) {
      try {
        fs.chmodSync(target, 0o666);
        fs.unlinkSync(target);
        console.log('[clean-next] Deleted after chmod:', target);
      } catch (err2) {
        console.warn('[clean-next] Failed to delete after chmod for:', target, err2.message || err2);
      }
    } else {
      console.warn('[clean-next] Failed to delete:', target, err.message || err);
    }
  }
}

try {
  targets.forEach(t => tryUnlink(t));
} catch (e) {
  console.warn('[clean-next] Unexpected error', e.message || e);
}

// Also attempt to remove whole .next directory if it's empty or when build generates conflicts? (Optional)
// We will not remove entire .next by default, only problematic files.

process.exit(0);
