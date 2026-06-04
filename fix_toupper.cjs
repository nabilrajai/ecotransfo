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
let changedCount = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('.toUpperCase()')) {
        let newContent = content.replace(/\?\.slice\(([^)]*)\)\.toUpperCase\(\)/g, '?.slice($1)?.toUpperCase()');
        if (newContent !== content) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log('Fixed toUpperCase in', file);
            changedCount++;
        }
    }
}
if (changedCount === 0) {
    console.log('No files needed fixing for toUpperCase.');
}
