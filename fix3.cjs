const fs = require('fs');

let content = fs.readFileSync('src/pages/ResourcesPage.tsx', 'utf8');

content = content.replace(/\\n/g, '\n');

fs.writeFileSync('src/pages/ResourcesPage.tsx', content, 'utf8');
console.log('Fixed ResourcesPage.tsx newlines');
