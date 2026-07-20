const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\el-parche-pos\\src\\app\\(dashboard)\\pos\\POSClient.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('placeholder="Escanea el código de barras')) {
    console.log(`Placeholder found at line ${index + 1}:`);
    for (let i = Math.max(0, index - 5); i < Math.min(lines.length, index + 10); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
