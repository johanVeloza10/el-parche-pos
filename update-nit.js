const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.configuracionNegocio.update({ where: { id: 'default' }, data: { nit: '52157597-9' } })
  .then(() => { console.log('NIT updated'); p.$disconnect(); })
  .catch(e => { console.error(e); p.$disconnect(); });
