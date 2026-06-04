const fs = require('fs');

let content = fs.readFileSync('src/pages/ResourcesPage.tsx', 'utf8');

content = content.replace(/\{filteredEmployees\.map\(\(emp\) => \(\n\s*<tr \n\s*key=\{emp\.uid\}/g, "{filteredEmployees.map((emp, idx) => (\\n                  <tr \\n                   key={`${emp.uid}-${idx}`}");

content = content.replace(/\{allProjects\.map\(\(p\) => \(\n\s*<option key=\{p\.id\} value=\{p\.id\}>/g, "{allProjects.map((p, idx) => (\\n                      <option key={`${p.id}-${idx}`} value={p.id}>");

content = content.replace(/\{userProjects\.map\(\(proj\) => \(\n\s*<div key=\{proj\.id\}/g, "{userProjects.map((proj, idx) => (\\n                    <div key={`${proj.id}-${idx}`}");

content = content.replace(/\{userLogs\.map\(\(log\) => \(\n\s*<div key=\{log\.id\}/g, "{userLogs.map((log, idx) => (\\n                    <div key={`${log.id}-${idx}`}");

fs.writeFileSync('src/pages/ResourcesPage.tsx', content, 'utf8');
console.log('Fixed ResourcesPage.tsx');
