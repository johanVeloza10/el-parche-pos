const fs = require('fs');
const path = require('path');

function search() {
  const dir = 'src/components/pdf';
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [];
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('locale') || line.includes('Date') || line.includes('String') || line.includes('format')) {
        matches.push(`${idx + 1}: ${line.trim()}`);
      }
    });
    if (matches.length > 0) {
      console.log(`\nFile: ${file}`);
      matches.forEach(m => console.log(m));
    }
  }
}
search();
