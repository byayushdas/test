const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add next to route handlers if missing
  content = content.replace(/async\s*\(\s*req\s*,\s*res\s*\)/g, 'async (req, res, next)');

  // Remove the old handleDbError require if I added it
  content = content.replace(/const \{ handleDbError \} = require\('\.\.\/utils\/errorHandler'\);\r?\n?/g, '');

  // Replace catch block bodies that use res.status(500) with next(err)
  // We can just find catch (err) { ... return res.status(500)... }
  // We will do a line-by-line replacement to be safe.
  const lines = content.split('\n');
  let currentCatchVar = 'err';
  let insideCatch = false;
  let catchBraceLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const catchMatch = line.match(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)/);
    if (catchMatch) {
      currentCatchVar = catchMatch[1];
    }
    
    // Check if line returns a 500 error inside a catch block (heuristically)
    if (line.includes('res.status(500)') && line.includes('json(')) {
      lines[i] = line.replace(/return\s+res\.status\(500\)\.json\([^)]+\);?|res\.status\(500\)\.json\([^)]+\);?/, `return next(${currentCatchVar});`);
    }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`Updated ${file}`);
}
