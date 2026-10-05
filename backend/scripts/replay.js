const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:\\Users\\Ayush\\.gemini\\antigravity-ide\\brain\\42ef3cb4-45cc-4e07-980c-f8a661e84822\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

let count = 0;

function normalizeLineEndings(str) {
  return str.replace(/\r\n/g, '\n');
}

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const step = JSON.parse(line);
    if (step.tool_calls) {
      for (const call of step.tool_calls) {
        if (call.name && call.args) {
          const args = call.args;
          const target = args.TargetFile || args.AbsolutePath;
          
          if (target && target.includes('routes') && target.includes('backend') && target.endsWith('.js')) {
            // Apply write_to_file
            if (call.name === 'default_api:write_to_file' || call.name === 'write_to_file') {
              if (args.CodeContent) {
                fs.writeFileSync(target, args.CodeContent, 'utf8');
                console.log(`Replayed write_to_file on ${target}`);
                count++;
              }
            }
            
            // Apply multi_replace_file_content
            if (call.name === 'default_api:multi_replace_file_content' || call.name === 'multi_replace_file_content') {
              if (args.ReplacementChunks && fs.existsSync(target)) {
                let content = normalizeLineEndings(fs.readFileSync(target, 'utf8'));
                for (const chunk of args.ReplacementChunks) {
                  const targetContent = normalizeLineEndings(chunk.TargetContent);
                  const replaceContent = normalizeLineEndings(chunk.ReplacementContent);
                  
                  if (content.includes(targetContent)) {
                    content = content.replace(targetContent, replaceContent);
                  } else {
                    console.log(`WARNING: Target content not found in ${target} for a chunk.`);
                  }
                }
                fs.writeFileSync(target, content, 'utf8');
                console.log(`Replayed multi_replace_file_content on ${target}`);
                count++;
              }
            }
            
            // Apply replace_file_content
            if (call.name === 'default_api:replace_file_content' || call.name === 'replace_file_content') {
              if (args.TargetContent && args.ReplacementContent && fs.existsSync(target)) {
                let content = normalizeLineEndings(fs.readFileSync(target, 'utf8'));
                const targetContent = normalizeLineEndings(args.TargetContent);
                const replaceContent = normalizeLineEndings(args.ReplacementContent);
                
                if (content.includes(targetContent)) {
                  content = content.replace(targetContent, replaceContent);
                } else {
                  console.log(`WARNING: Target content not found in ${target}.`);
                }
                fs.writeFileSync(target, content, 'utf8');
                console.log(`Replayed replace_file_content on ${target}`);
                count++;
              }
            }
          }
        }
      }
    }
  } catch (e) {
    // ignore parse errors
  }
}
console.log(`Replay finished. Replayed ${count} edits.`);
