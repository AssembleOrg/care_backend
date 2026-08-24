-- El campo experiencia se guarda ENCRIPTADO. El cifrado agranda el texto respecto
-- al plano, por lo que un VarChar(200) se desbordaba (error crudo de Prisma al usuario).
-- Se pasa a TEXT, igual que MensajeContacto.mensaje.
ALTER TABLE "SolicitudEmpleo" ALTER COLUMN "experiencia" SET DATA TYPE TEXT;
