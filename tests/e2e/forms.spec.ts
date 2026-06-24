import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

// PDF mínimo válido generado al vuelo para el test de CV
function makeTempPdf(): string {
    const pdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]>>endobj\nxref\n0 4\n0000000000 65535 f \ntrailer<</Root 1 0 R/Size 4>>\nstartxref\n0\n%%EOF';
    const filePath = path.join(os.tmpdir(), `cv-test-añó-ñ.pdf`);
    fs.writeFileSync(filePath, pdf);
    return filePath;
}

const stamp = Date.now();

test.describe('Formularios del home', () => {
    test('Formulario de Contacto envía y muestra éxito', async ({ page }) => {
        await page.goto('/');

        const section = page.locator('#contacto');
        await section.scrollIntoViewIfNeeded();

        await section.getByPlaceholder('Nombre completo').fill(`Test Contacto ${stamp}`);
        await section.getByPlaceholder('Teléfono').fill('1161592591');
        await section.getByPlaceholder('Correo electrónico').fill(`contacto.test.${stamp}@example.com`);
        await section.getByPlaceholder('¿Cómo podemos ayudarle?').fill('Mensaje de prueba automatizado (Playwright).');

        await section.getByRole('button', { name: 'Enviar mensaje' }).click();

        await expect(page.getByText(/Mensaje enviado/i)).toBeVisible();
    });

    test('Formulario Trabaja con Nosotros (sin CV) envía y muestra éxito', async ({ page }) => {
        await page.goto('/');

        const section = page.locator('#trabaja-con-nosotros');
        await section.scrollIntoViewIfNeeded();

        await section.getByPlaceholder('Nombre', { exact: true }).fill(`TestNombre ${stamp}`);
        await section.getByPlaceholder('Apellido').fill('TestApellido');
        await section.getByPlaceholder(/Zona de Trabajo/i).fill('CABA');
        await section.getByPlaceholder('Correo electrónico').fill(`empleo.test.${stamp}@example.com`);
        await section.getByPlaceholder('Teléfono').fill(`11${String(stamp).slice(-8)}`);
        await section.getByPlaceholder(/Contanos tu experiencia/i).fill('5 años cuidando adultos mayores.');

        await section.getByRole('button', { name: 'Enviar Postulación' }).click();

        await expect(page.getByText(/Solicitud enviada/i)).toBeVisible();
    });

    test('Formulario Trabaja con Nosotros (con CV, nombre con ñ/acentos) envía y muestra éxito', async ({ page }) => {
        const pdfPath = makeTempPdf();
        await page.goto('/');

        const section = page.locator('#trabaja-con-nosotros');
        await section.scrollIntoViewIfNeeded();

        await section.getByPlaceholder('Nombre', { exact: true }).fill(`TestCV ${stamp}`);
        await section.getByPlaceholder('Apellido').fill('Peñaloza');
        await section.getByPlaceholder(/Zona de Trabajo/i).fill('Zona Sur');
        await section.getByPlaceholder('Correo electrónico').fill(`empleo.cv.${stamp}@example.com`);
        await section.getByPlaceholder('Teléfono').fill(`12${String(stamp).slice(-8)}`);
        await section.getByPlaceholder(/Contanos tu experiencia/i).fill('Adjunto CV con nombre acentuado.');

        await section.locator('input[type="file"]').setInputFiles(pdfPath);

        await section.getByRole('button', { name: 'Enviar Postulación' }).click();

        await expect(page.getByText(/Solicitud enviada/i)).toBeVisible();
    });
});
