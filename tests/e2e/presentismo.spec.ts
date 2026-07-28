import { test, expect, type Page } from '@playwright/test';

// El spec toca la DB directamente para envejecer un fichaje y para limpiar.
process.loadEnvFile('.env');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@carebydani.com';
const ADMIN_PASS = process.env.E2E_ADMIN_PASSWORD || 'admin123';

const stamp = Date.now();
const CUIDADOR = `E2E Cuidador ${stamp}`;
const PERSONA = `E2E Persona ${stamp}`;
const EMPLEADO_EMAIL = `e2e.empleado.${stamp}@carebydani.test`;
const EMPLEADO_PASS = `E2E-pass-${stamp}`;

// Datos que se van encadenando entre tests.
const ctx: {
  personaId?: string;
  cuidadorId?: string;
  lat?: number;
  lng?: number;
} = {};

async function loginComo(page: Page, email: string, password: string, destino: RegExp) {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(destino, { timeout: 30_000 });
}

/** Elige una opción de un Select de Mantine por texto. */
async function elegirEnSelect(page: Page, label: string | RegExp, opcion: string) {
  await page.getByRole('textbox', { name: label }).click();
  await page.getByRole('option', { name: opcion }).click();
}

test.describe.configure({ mode: 'serial' });

test.describe('Presentismo end-to-end', () => {
  test('admin carga cuidador, persona con ubicación y usuario empleado', async ({ page }) => {
    await loginComo(page, ADMIN_EMAIL, ADMIN_PASS, /\/admin$/);

    // --- Cuidador ---
    await page.goto('/admin/cuidadores');
    await page.getByRole('button', { name: 'Nuevo Cuidador' }).click();
    const modalCuidador = page.getByRole('dialog');
    await modalCuidador.getByLabel('Nombre Completo').fill(CUIDADOR);
    await modalCuidador.getByLabel('DNI').fill(String(stamp).slice(-8));
    // Email vacío a propósito: es opcional y no debe romper la validación.
    await modalCuidador.getByRole('button', { name: 'Crear' }).click();
    await expect(modalCuidador).toBeHidden();

    await page.getByPlaceholder('Buscar por nombre...').fill(CUIDADOR);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByRole('cell', { name: CUIDADOR })).toBeVisible();

    // --- Persona asistida con punto en el mapa ---
    await page.goto('/admin/personas-asistidas');
    await page.getByRole('button', { name: 'Nueva Persona' }).click();
    const modalPersona = page.getByRole('dialog');
    await modalPersona.getByLabel('Nombre Completo').fill(PERSONA);
    await modalPersona.getByLabel('Dirección', { exact: true }).fill('Av. de Mayo 500, CABA');

    // Click en el centro del mapa: deja el pin en el centro por defecto.
    const mapa = modalPersona.locator('.leaflet-container');
    await expect(mapa).toBeVisible({ timeout: 20_000 });
    await mapa.click();
    await expect(modalPersona.getByText(/-34\.\d+, -58\.\d+/)).toBeVisible();

    await modalPersona.getByRole('button', { name: 'Crear' }).click();
    await expect(modalPersona).toBeHidden();

    await page.getByPlaceholder('Buscar por nombre...').fill(PERSONA);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByRole('cell', { name: PERSONA })).toBeVisible();

    // Coordenadas reales que quedaron guardadas (las necesita el fichaje).
    const res = await page.request.get(`/api/v1/personas-asistidas?all=true&search=${encodeURIComponent(PERSONA)}`);
    const body = await res.json();
    const persona = body.data.find((p: { nombreCompleto: string }) => p.nombreCompleto === PERSONA);
    expect(persona, 'la persona debería existir en la API').toBeTruthy();
    expect(persona.lat, 'la persona debería tener latitud').toBeTruthy();
    ctx.personaId = persona.id;
    ctx.lat = persona.lat;
    ctx.lng = persona.lng;

    // --- Vincular cuidador a la persona ---
    const fila = page.getByRole('row', { name: new RegExp(PERSONA) });
    await fila.getByRole('button').first().click(); // ojo = ver
    const modalVer = page.getByRole('dialog');
    await modalVer.getByRole('button', { name: 'Gestionar' }).click();
    const modalCuidadores = page.getByRole('dialog').filter({ hasText: 'Gestionar Cuidadores' });
    await modalCuidadores.getByRole('textbox', { name: 'Agregar Cuidador' }).click();
    // Se espera la respuesta: si se navega antes, el POST del vínculo se aborta.
    const [altaVinculo] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes(`/personas-asistidas/${ctx.personaId}/cuidadores`) && r.request().method() === 'POST'
      ),
      page.getByRole('option', { name: CUIDADOR }).click(),
    ]);
    expect(altaVinculo.status()).toBe(200);
    await page.keyboard.press('Escape');

    const vinculo = await prisma.personaCuidador.findFirst({ where: { personaId: ctx.personaId, activo: true } });
    expect(vinculo, 'la persona debería quedar vinculada al cuidador').toBeTruthy();

    // --- Usuario empleado vinculado al cuidador ---
    await page.goto('/admin/usuarios');
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    const modalUsuario = page.getByRole('dialog');
    await modalUsuario.getByLabel('Email').fill(EMPLEADO_EMAIL);
    await modalUsuario.getByLabel('Nombre').fill(`E2E Empleado ${stamp}`);
    await modalUsuario.getByLabel('Contraseña').fill(EMPLEADO_PASS);
    await modalUsuario.getByRole('textbox', { name: 'Cuidador vinculado' }).click();
    await page.getByRole('option', { name: CUIDADOR }).click();
    await modalUsuario.getByRole('button', { name: 'Crear usuario' }).click();

    await expect(page.getByRole('cell', { name: EMPLEADO_EMAIL })).toBeVisible();
    const filaUsuario = page.getByRole('row', { name: new RegExp(EMPLEADO_EMAIL) });
    await expect(filaUsuario.getByText('Empleado', { exact: true })).toBeVisible();
    await expect(filaUsuario.getByRole('cell', { name: CUIDADOR })).toBeVisible();

    const usuario = await prisma.usuario.findUnique({ where: { email: EMPLEADO_EMAIL } });
    expect(usuario?.cuidadorId, 'el usuario debería quedar vinculado al cuidador').toBeTruthy();
    ctx.cuidadorId = usuario!.cuidadorId!;
  });

  test('empleado ficha entrada en rango y salida fuera de rango', async ({ browser }) => {
    // Parado exactamente en el domicilio.
    const contexto = await browser.newContext({
      permissions: ['geolocation'],
      geolocation: { latitude: ctx.lat!, longitude: ctx.lng! },
    });
    const page = await contexto.newPage();

    await loginComo(page, EMPLEADO_EMAIL, EMPLEADO_PASS, /\/empleado$/);
    await expect(page.getByText(PERSONA)).toBeVisible();

    // Antes de que quede registrado hay que ver dónde estamos en el mapa.
    await page.getByRole('button', { name: 'Marcar entrada' }).click();
    const confirmarEntrada = page.getByRole('dialog');
    await expect(confirmarEntrada.getByRole('heading', { name: 'Confirmar entrada' })).toBeVisible({ timeout: 30_000 });
    await expect(confirmarEntrada.locator('.leaflet-container')).toBeVisible();
    await expect(confirmarEntrada.getByText(/Estás a \d+ m del domicilio, dentro de los \d+ m/)).toBeVisible();

    await confirmarEntrada.getByRole('button', { name: 'Confirmar entrada' }).click();
    await expect(page.getByText(/Entrada registrada/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Turno abierto')).toBeVisible();

    // El turno se envejece 3 horas para que la liquidación tenga horas reales.
    await prisma.fichaje.updateMany({
      where: { cuidadorId: ctx.cuidadorId, salidaAt: null },
      data: { entradaAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    });

    // Salida a ~300 m: fuera del radio de 50 m, tiene que registrarse igual.
    await contexto.setGeolocation({ latitude: ctx.lat! + 300 / 111_320, longitude: ctx.lng! });
    await page.reload();
    await page.getByRole('button', { name: 'Marcar salida' }).click();
    const confirmarSalida = page.getByRole('dialog');
    await expect(confirmarSalida.getByRole('heading', { name: 'Confirmar salida' })).toBeVisible({ timeout: 30_000 });
    // El mapa ya avisa que está lejos, antes de registrar nada.
    await expect(confirmarSalida.getByText(/más de los \d+ m permitidos/)).toBeVisible();

    await confirmarSalida.getByRole('button', { name: 'Confirmar salida' }).click();
    await expect(page.getByText(/Salida registrada/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/se registró igual y la administración lo va a revisar/i)).toBeVisible();

    // El turno cerrado aparece en el historial del empleado.
    await expect(page.getByText('Últimos turnos')).toBeVisible();
    await expect(page.getByText('A revisar').first()).toBeVisible();

    await contexto.close();
  });

  test('empleado no puede entrar al panel de administración', async ({ browser }) => {
    const contexto = await browser.newContext();
    const page = await contexto.newPage();
    await loginComo(page, EMPLEADO_EMAIL, EMPLEADO_PASS, /\/empleado$/);

    await page.goto('/admin/usuarios');
    await expect(page).toHaveURL(/\/empleado$/);

    const res = await page.request.get('/api/v1/usuarios');
    expect(res.status(), 'la API de usuarios debe rechazar a un empleado').toBe(403);

    await contexto.close();
  });

  test('admin revisa el fichaje y lo usa para liquidar', async ({ page }) => {
    await loginComo(page, ADMIN_EMAIL, ADMIN_PASS, /\/admin$/);

    // --- Presentismo ---
    await page.goto('/admin/presentismo');
    const fila = page.getByRole('row', { name: new RegExp(CUIDADOR) });
    await expect(fila).toBeVisible({ timeout: 30_000 });
    await expect(fila.getByText('A revisar')).toBeVisible();
    await expect(fila.getByText(/^S: \d+ m$/)).toBeVisible();

    await fila.getByRole('button', { name: 'Aprobar' }).click();
    await expect(page.getByText(/Fichaje aprobado/i)).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(CUIDADOR) }).getByText('Aprobado')).toBeVisible();

    // --- Liquidaciones: popup de horas fichadas ---
    await page.goto('/admin/liquidaciones');
    await elegirEnSelect(page, 'Cuidador', CUIDADOR);
    await page.getByRole('button', { name: 'Ver horas fichadas' }).click();

    const modal = page.getByRole('dialog');
    await expect(modal.getByText('Horas fichadas desde la última liquidación')).toBeVisible();
    await expect(modal.getByText(PERSONA)).toBeVisible();
    await expect(modal.getByText(/^3 h$/)).toBeVisible();

    await modal.getByRole('button', { name: /Usar estas horas/ }).click();
    await expect(page.getByLabel('Horas trabajadas')).toHaveValue('3');

    // Y la liquidación se puede completar con esas horas.
    await page.getByLabel('Precio por hora').fill('1000');
    await expect(page.getByText('$3000.00')).toBeVisible();
  });

  test.afterAll(async () => {
    // Limpieza: los datos E2E no quedan en la base de producción.
    try {
      if (ctx.cuidadorId) {
        await prisma.fichaje.deleteMany({ where: { cuidadorId: ctx.cuidadorId } });
        await prisma.pago.deleteMany({ where: { cuidadorId: ctx.cuidadorId } });
      }
      const usuario = await prisma.usuario.findUnique({ where: { email: EMPLEADO_EMAIL } });
      if (usuario) {
        await prisma.usuario.delete({ where: { id: usuario.id } });
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } }
        );
        await admin.auth.admin.deleteUser(usuario.id);
      }
      if (ctx.personaId) {
        await prisma.personaCuidador.deleteMany({ where: { personaId: ctx.personaId } });
        await prisma.personaAsistida.delete({ where: { id: ctx.personaId } });
      }
      if (ctx.cuidadorId) {
        await prisma.cuidador.delete({ where: { id: ctx.cuidadorId } });
      }
    } finally {
      await prisma.$disconnect();
    }
  });
});
