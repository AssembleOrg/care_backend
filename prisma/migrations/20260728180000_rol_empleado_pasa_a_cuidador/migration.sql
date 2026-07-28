-- El rol se llamaba EMPLEADO, pero en el dominio esa persona es un cuidador:
-- es el mismo nombre que usa el resto del sistema (tabla Cuidador, /cuidador).
-- Renombrar el valor conserva las filas existentes.
ALTER TYPE "RolUsuario" RENAME VALUE 'EMPLEADO' TO 'CUIDADOR';
