const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else { 
            /* Is a file */
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    const replacements = [
        ['project.id.slice', 'project.id?.slice'],
        ['lot.id.slice', 'lot.id?.slice'],
        ['item.id.slice', 'item.id?.slice'],
        ['task.projectId.slice', 'task.projectId?.slice'],
        ['task.id.slice', 'task.id?.slice'],
        ['depId.slice', 'depId?.slice']
    ];

    for (const [search, replace] of replacements) {
        if (content.includes(search)) {
            content = content.replace(new RegExp(search.replace(/\./g, '\\.'), 'g'), replace);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
}
