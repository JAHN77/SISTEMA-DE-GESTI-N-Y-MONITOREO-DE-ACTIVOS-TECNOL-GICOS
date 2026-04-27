-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TECHNICIAN', 'USER');

-- CreateEnum
CREATE TYPE "EstadoTecnico" AS ENUM ('OPERATIVO', 'DANADO', 'EN_MANTENIMIENTO', 'EN_REPARACION', 'FUERA_DE_SERVICIO', 'DE_BAJA');

-- CreateEnum
CREATE TYPE "EstadoUso" AS ENUM ('DISPONIBLE', 'ASIGNADO', 'RESERVADO', 'NO_DISPONIBLE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CREACION', 'ACTUALIZACION', 'CAMBIO_ESTADO', 'ASIGNACION', 'DESASIGNACION', 'MANTENIMIENTO', 'CAMBIO_CATEGORIA', 'CAMBIO_UBICACION');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVO', 'CORRECTIVO', 'CALIBRACION');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "descripcion" TEXT,
    "parentId" INTEGER,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigoInventario" TEXT NOT NULL,
    "serial" TEXT,
    "estadoTecnico" "EstadoTecnico" NOT NULL DEFAULT 'OPERATIVO',
    "estadoUso" "EstadoUso" NOT NULL DEFAULT 'DISPONIBLE',
    "imageUrl" TEXT,
    "categoryId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetSpec" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "cpu" TEXT,
    "ram" TEXT,
    "almacenamiento" TEXT,
    "sistemaOperativo" TEXT,
    "versionSO" TEXT,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "hostname" TEXT,
    "data" JSONB,

    CONSTRAINT "AssetSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAssignment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "asignadoPorId" INTEGER,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),

    CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" SERIAL NOT NULL,
    "tipo" "EventType" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "assetId" INTEGER NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovementRequest" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "nuevaLocationId" INTEGER,
    "motivo" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "tipo" "MaintenanceType" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "proveedor" TEXT,
    "costo" DECIMAL(12,2),
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "realizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_nombre_key" ON "Location"("nombre");

-- CreateIndex
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_codigoInventario_key" ON "Asset"("codigoInventario");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_serial_key" ON "Asset"("serial");

-- CreateIndex
CREATE INDEX "Asset_estadoTecnico_idx" ON "Asset"("estadoTecnico");

-- CreateIndex
CREATE INDEX "Asset_estadoUso_idx" ON "Asset"("estadoUso");

-- CreateIndex
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");

-- CreateIndex
CREATE INDEX "Asset_locationId_idx" ON "Asset"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetSpec_assetId_key" ON "AssetSpec"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetSpec_macAddress_key" ON "AssetSpec"("macAddress");

-- CreateIndex
CREATE INDEX "AssetSpec_ipAddress_idx" ON "AssetSpec"("ipAddress");

-- CreateIndex
CREATE INDEX "AssetSpec_hostname_idx" ON "AssetSpec"("hostname");

-- CreateIndex
CREATE INDEX "AssetAssignment_assetId_idx" ON "AssetAssignment"("assetId");

-- CreateIndex
CREATE INDEX "AssetAssignment_userId_idx" ON "AssetAssignment"("userId");

-- CreateIndex
CREATE INDEX "AssetAssignment_asignadoPorId_idx" ON "AssetAssignment"("asignadoPorId");

-- CreateIndex
CREATE INDEX "EventLog_assetId_fecha_idx" ON "EventLog"("assetId", "fecha");

-- CreateIndex
CREATE INDEX "EventLog_tipo_idx" ON "EventLog"("tipo");

-- CreateIndex
CREATE INDEX "MovementRequest_assetId_idx" ON "MovementRequest"("assetId");

-- CreateIndex
CREATE INDEX "MovementRequest_requestedById_idx" ON "MovementRequest"("requestedById");

-- CreateIndex
CREATE INDEX "MovementRequest_status_idx" ON "MovementRequest"("status");

-- CreateIndex
CREATE INDEX "Maintenance_assetId_idx" ON "Maintenance"("assetId");

-- CreateIndex
CREATE INDEX "Maintenance_fechaInicio_idx" ON "Maintenance"("fechaInicio");

-- CreateIndex
CREATE INDEX "Maintenance_tipo_idx" ON "Maintenance"("tipo");

-- CreateIndex
CREATE INDEX "Maintenance_realizadoPorId_idx" ON "Maintenance"("realizadoPorId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetSpec" ADD CONSTRAINT "AssetSpec_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_asignadoPorId_fkey" FOREIGN KEY ("asignadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementRequest" ADD CONSTRAINT "MovementRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementRequest" ADD CONSTRAINT "MovementRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementRequest" ADD CONSTRAINT "MovementRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementRequest" ADD CONSTRAINT "MovementRequest_nuevaLocationId_fkey" FOREIGN KEY ("nuevaLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
