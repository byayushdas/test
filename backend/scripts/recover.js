const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:\\Users\\Ayush\\.gemini\\antigravity-ide\\brain\\42ef3cb4-45cc-4e07-980c-f8a661e84822\\.system_generated\\logs\\transcript_full.jsonl';
const routesDir = path.join(__dirname, '../routes');

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

// We will track the latest content for each file by applying edits or looking for the last write_to_file
// Since multi_replace_file_content requires the previous state, it's easier to just find the last time the file was shown completely, OR we can apply the chunks.
// Wait, the tool response for multi_replace_file_content often doesn't show the full file.
// But wait! If the file was edited, the final state isn't explicitly printed unless there was a view_file afterwards.

// Let's look for "Created file ... with requested content." or similar? No, the tool call itself has ReplacementChunks.
// Writing an entire patch applier in JS might be buggy.
// Let's just grep the transcript for the last write_to_file for each route if they did write_to_file.
// If they used multi_replace, it's harder.

// Let's check what tools were used on routes:
let routeEdits = [];
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const step = JSON.parse(line);
    if (step.tool_calls) {
      for (const call of step.tool_calls) {
        if (call.function && call.function.arguments) {
          const args = JSON.parse(call.function.arguments);
          if (args.TargetFile && args.TargetFile.includes('backend\\\\routes')) {
            routeEdits.push({ tool: call.function.name, file: args.TargetFile, args: args });
          }
        }
      }
    }
  } catch (e) {}
}

fs.writeFileSync('edits.json', JSON.stringify(routeEdits, null, 2));
console.log(`Found ${routeEdits.length} edits on routes.`);
