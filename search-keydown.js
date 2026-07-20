const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\el-parche-pos\\src\\app\\(dashboard)\\pos\\POSClient.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.toLowerCase().includes('keydown') || line.toLowerCase().includes('keypress') || line.toLowerCase().includes('key ===')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
