const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\el-parche-pos\\src\\app\\(dashboard)\\pos\\POSClient.tsx', 'utf8');

// Find the input element with placeholder "Escanea el código"
const inputIndex = content.indexOf('Escanea el código');
if (inputIndex !== -1) {
  // print 1000 characters before and after the placeholder
  console.log("Context around search input:");
  console.log(content.substring(Math.max(0, inputIndex - 500), inputIndex + 500));
} else {
  console.log("Search input placeholder not found");
}
