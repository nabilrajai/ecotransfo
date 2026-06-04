const fs = require('fs');
const content = fs.readFileSync('map_calls.txt', 'utf8');
const chunks = content.split('--');
chunks.forEach(chunk => {
    if (chunk.includes('<') && !chunk.includes('key=')) {
        console.log(chunk);
    }
});
