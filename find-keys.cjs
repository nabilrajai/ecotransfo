const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    // find all .map(
    let regex = /\.map\s*\(\s*(?:([a-zA-ZÀ-ÿ0-9_$]+)|(?:(\([^)]*\))))\s*=>\s*([\s\S]*?)(\)|\}|$)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        let body = match[3].trim();
        // check if it starts returning a JSX element
        if (body.startsWith('<')) {
            // does it have key=?
            // only check the first tag
            let firstTagMatch = /^<([a-zA-Z0-9_.-]+)([^>]*)>/.exec(body);
            if (firstTagMatch) {
                let attrs = firstTagMatch[2];
                if (!attrs.includes('key=')) {
                    console.log(`Missing key in ${file}`);
                    console.log(`Line: ${content.substring(0, match.index).split('\n').length}`);
                    console.log('---');
                }
            }
        }
        else if (body.startsWith('{')) {
          // starts returning a block or returning inside a block
          let innerMatch = /\b(?:return|)\s*(<([a-zA-Z0-9_.-]+)([^>]*)>)/.exec(body);
          if (innerMatch) {
            let attrs = innerMatch[3];
            if (!attrs.includes('key=')) {
              console.log(`Missing key in ${file}`);
              console.log(`Line: ${content.substring(0, match.index).split('\n').length}`);
              console.log('---');  
            }
          }
        }
    }
}
