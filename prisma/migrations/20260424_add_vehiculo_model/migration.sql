-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" TEXT NOT NULL,
    "patente" TEXT NOT NULL,
    "patenteMostrar" TEXT NOT NULL,
    "choferNombre" TEXT,
    "choferDni" TEXT,
    "choferTelefono" TEXT,
    "habilitacion" TEXT,
    "empresa" TEXT,
    "transportistaId" TEXT,
    "ultimaVisita" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vecesVisita" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_patente_key" ON "Vehiculo"("patente");

-- CreateIndex
CREATE INDEX "Vehiculo_patente_idx" ON "Vehiculo"("patente");

-- AddColumn
ALTER TABLE "PesajeCamion" ADD COLUMN "vehiculoId" TEXT;

-- CreateIndex
CREATE INDEX "PesajeCamion_vehiculoId_idx" ON "PesajeCamion"("vehiculoId");

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_transportistaId_fkey" FOREIGN KEY ("transportistaId") REFERENCES "Transportista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PesajeCamion" ADD CONSTRAINT "PesajeCamion_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
