import { Role, TechnicalStatus, UsageStatus, LocationType, EventType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/password';

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Usuarios — contraseñas hasheadas con PBKDF2-SHA512
  const admin = await prisma.user.upsert({
    where: { email: 'admin@itam.local' },
    update: { password: hashPassword('Admin123!') },
    create: {
      name: 'Admin Principal',
      email: 'admin@itam.local',
      password: hashPassword('Admin123!'),
      role: Role.SUPER_ADMIN,
      department: 'IT',
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tech@itam.local' },
    update: { password: hashPassword('Tech123!') },
    create: {
      name: 'Técnico Soporte',
      email: 'tech@itam.local',
      password: hashPassword('Tech123!'),
      role: Role.TECHNICIAN,
      department: 'Soporte',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@itam.local' },
    update: { password: hashPassword('User123!') },
    create: {
      name: 'Usuario Regular',
      email: 'user@itam.local',
      password: hashPassword('User123!'),
      role: Role.USER,
      department: 'Ventas',
    },
  });

  console.log('✅ Usuarios creados o verificados');

  // 2. Ubicaciones
  const campus = await prisma.location.upsert({
    where: { code: 'CUC-MAIN' },
    update: {},
    create: {
      name: 'Campus Principal',
      type: LocationType.CAMPUS,
      code: 'CUC-MAIN',
    },
  });

  const buildingA = await prisma.location.upsert({
    where: { code: 'CUC-BLDG-A' },
    update: {},
    create: {
      name: 'Edificio A',
      type: LocationType.BUILDING,
      code: 'CUC-BLDG-A',
      parentId: campus.id,
    },
  });

  const itOffice = await prisma.location.upsert({
    where: { code: 'CUC-BLDG-A-IT' },
    update: {},
    create: {
      name: 'Oficina IT',
      type: LocationType.OFFICE,
      code: 'CUC-BLDG-A-IT',
      parentId: buildingA.id,
    },
  });

  console.log('✅ Ubicaciones creadas o verificadas');

  // 3. Categorías
  const hwCat = await prisma.category.upsert({
    where: { slug: 'hardware' },
    update: {},
    create: {
      name: 'Hardware',
      slug: 'hardware',
      description: 'Equipos físicos',
      color: '#3b82f6',
      iconName: 'Laptop',
    },
  });

  const laptopCat = await prisma.category.upsert({
    where: { slug: 'laptops' },
    update: {},
    create: {
      name: 'Laptops',
      slug: 'laptops',
      parentId: hwCat.id,
    },
  });

  const serverCat = await prisma.category.upsert({
    where: { slug: 'servers' },
    update: {},
    create: {
      name: 'Servidores',
      slug: 'servers',
      parentId: hwCat.id,
    },
  });

  console.log('✅ Categorías creadas o verificadas');

  // 4. Activos (Assets)
  const asset1 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-LAP-001' },
    update: {},
    create: {
      name: 'MacBook Pro M2',
      inventoryCode: 'INV-LAP-001',
      serialNumber: 'C02XXXXX001',
      technicalStatus: TechnicalStatus.OPERATIONAL,
      usageStatus: UsageStatus.AVAILABLE,
      categoryId: laptopCat.id,
      locationId: itOffice.id,
      acquisitionValue: 2500.00,
      spec: {
        create: {
          brand: 'Apple',
          model: 'MacBook Pro 14"',
          cpu: 'M2 Pro',
          ram: '16GB',
          storage: '512GB SSD',
          operatingSystem: 'macOS Sonoma',
        }
      }
    },
  });

  const asset2 = await prisma.asset.upsert({
    where: { inventoryCode: 'INV-SRV-001' },
    update: {},
    create: {
      name: 'Servidor Dell PowerEdge R740',
      inventoryCode: 'INV-SRV-001',
      serialNumber: 'DLXXXXX001',
      technicalStatus: TechnicalStatus.OPERATIONAL,
      usageStatus: UsageStatus.AVAILABLE,
      categoryId: serverCat.id,
      locationId: buildingA.id,
      acquisitionValue: 5500.00,
      spec: {
        create: {
          brand: 'Dell',
          model: 'PowerEdge R740',
          cpu: 'Dual Intel Xeon Gold',
          ram: '128GB',
          storage: '4TB NVMe',
          operatingSystem: 'Ubuntu Server 22.04 LTS',
        }
      }
    },
  });

  console.log('✅ Activos creados o verificados');

  // 5. Asignación (AssetAssignment)
  const existingAssignment = await prisma.assetAssignment.findFirst({
    where: { assetId: asset1.id, endDate: null }
  });
  
  if (!existingAssignment) {
    await prisma.assetAssignment.create({
      data: {
        userId: user.id,
        assetId: asset1.id,
        createdById: admin.id,
        notes: 'Asignación inicial para nuevo empleado',
      }
    });

    // Update asset status
    await prisma.asset.update({
      where: { id: asset1.id },
      data: { usageStatus: UsageStatus.ASSIGNED }
    });

    // Create EventLog
    await prisma.eventLog.create({
      data: {
        type: EventType.ASSIGNED,
        description: 'Activo asignado a Usuario Regular',
        assetId: asset1.id,
        userId: admin.id,
      }
    });
    console.log('✅ Asignación creada para el activo 1');
  }

  // Evento de creación para el Servidor
  const existingLog = await prisma.eventLog.findFirst({
    where: { assetId: asset2.id, type: EventType.CREATED }
  });

  if (!existingLog) {
    await prisma.eventLog.create({
      data: {
        type: EventType.CREATED,
        description: 'Registro inicial de Servidor Dell',
        assetId: asset2.id,
        userId: admin.id,
      }
    });
  }

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
