const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.usuario.update({ 
  where: { email: 'admin@elparche.co' }, 
  data: { nombre: 'EKA' } 
}).then(u => { 
  console.log('Usuario actualizado:', u.nombre); 
  p.$disconnect(); 
}).catch(e => { console.error(e); p.$disconnect(); });
