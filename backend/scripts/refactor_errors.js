const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert require statement if not there
  if (!content.includes('const { handleDbError }')) {
    content = `const { handleDbError } = require('../utils/errorHandler');\n` + content;
  }

  // Replace common res.status(500) variations inside catch (err)
  // We'll replace lines matching exactly these patterns.
  
  const lines = content.split('\n');
  let currentCatchVar = 'err';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Track the catch variable
    const catchMatch = line.match(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)/);
    if (catchMatch) {
      currentCatchVar = catchMatch[1];
    }
    
    if (line.includes('res.status(500)')) {
      // If it's a typical 500 error return
      if (line.includes('json(')) {
        // Replace this line with return handleDbError(err, res);
        lines[i] = line.replace(/return\s+res\.status\(500\)\.json\([^)]+\);?|res\.status\(500\)\.json\([^)]+\);?/, `return handleDbError(${currentCatchVar}, res);`);
      }
    }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`Refactored ${file}`);
}
