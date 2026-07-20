const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\el-parche-pos\\src\\app\\(dashboard)\\pos\\POSClient.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching search logic in POSClient.tsx:");
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('buscar') || line.toLowerCase().includes('search') || line.toLowerCase().includes('barcode') || line.toLowerCase().includes('barras')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
