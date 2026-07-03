const ExcelJS = require('exceljs');
const wb = new ExcelJS.Workbook();

wb.xlsx.readFile('LIBRO FISCAL 2026 (4).xlsx').then(() => {
  const sheets = [
    'ENERO - EL PARCHE TIENDA',
    'FEBRERO - EL PARCHE TIENDA',
    'MARZO - EL PARCHE TIENDA',
    'ABRIL - EL PARCHE TIENDA',
    'MAYO',
    'JUNIO',
    'JULIO'
  ];
  const meses = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO'];

  sheets.forEach((name, idx) => {
    const sheet = wb.getWorksheet(name);
    if (!sheet) return;

    console.log('\n========== ' + meses[idx] + ' ==========');

    let diasConVenta = 0;
    let totalVentas = 0;

    for (let i = 3; i <= 33; i++) {
      const row = sheet.getRow(i);
      let dia = null, ventas = null, pagos = null, ingreso = null, gastos = null, saldo = null;

      row.eachCell({ includeEmpty: true }, (cell, col) => {
        let v = cell.value;
        if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
        if (col === 1) dia = v;
        if (col === 2) ventas = v;
        if (col === 3) pagos = v;
        if (col === 4) ingreso = v;
        if (col === 5) gastos = v;
        if (col === 6) saldo = v;
      });

      if (ventas && ventas > 0) {
        diasConVenta++;
        console.log('  Dia ' + dia + ': Ventas=$' + Number(ventas).toLocaleString('es-CO') +
          ' | Pago Terceros=$' + Number(pagos || 0).toLocaleString('es-CO') +
          ' | Gastos=$' + Number(gastos || 0).toLocaleString('es-CO'));
      } else if (gastos && gastos > 0) {
        console.log('  Dia ' + dia + ': (solo gastos) Gastos=$' + Number(gastos).toLocaleString('es-CO'));
      }
    }

    // TOTAL row
    const totalRow = sheet.getRow(34);
    let tVentas = 0, tPagos = 0, tIngreso = 0, tGastos = 0, tSaldo = 0;
    totalRow.eachCell({ includeEmpty: true }, (cell, col) => {
      let v = cell.value;
      if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
      if (col === 2) tVentas = v || 0;
      if (col === 3) tPagos = v || 0;
      if (col === 4) tIngreso = v || 0;
      if (col === 5) tGastos = v || 0;
      if (col === 6) tSaldo = v || 0;
    });

    console.log('\n  RESUMEN ' + meses[idx] + ':');
    console.log('  Total Ventas:         $' + Number(tVentas).toLocaleString('es-CO'));
    console.log('  Pago a Terceros:      $' + Number(tPagos).toLocaleString('es-CO'));
    console.log('  Ingreso a Libro:      $' + Number(tIngreso).toLocaleString('es-CO'));
    console.log('  Gastos:               $' + Number(tGastos).toLocaleString('es-CO'));
    console.log('  Saldo:                $' + Number(tSaldo).toLocaleString('es-CO'));
    console.log('  Dias con ventas:      ' + diasConVenta);
  });
});
