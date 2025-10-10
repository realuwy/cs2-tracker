// Create a .env.local template if not present
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(p)) {
  fs.writeFileSync(p, `# Environment variables for CS2 Inventory Tracker
NEXT_PUBLIC_DEFAULT_CURRENCY=AUD
# Optional: Steam Web API key only needed for vanity resolution if you want server-side calls later
STEAM_WEB_API_KEY=
`);
}
