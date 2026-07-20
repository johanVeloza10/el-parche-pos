const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\el-parche-pos\\src\\app\\(dashboard)\\inventario\\InventoryClient.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.toLowerCase().includes('placeholder=') || line.toLowerCase().includes('onkeydown')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
