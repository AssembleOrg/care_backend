import { test, expect, Page } from '@playwright/test';

/**
 * Guard de contraste del panel admin.
 *
 * El bug que motivó estos tests: el texto del panel se renderizaba en #0f172a
 * sobre fondo #1e293b (1.1:1, ilegible). Un screenshot no lo detecta de forma
 * fiable; el color computado sí. Ver design.md §1.4.
 *
 * Requiere credenciales de admin:
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 * Sin ellas, los tests se saltan en vez de fallar (el panel está tras auth).
 */

const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

/** Luminancia relativa WCAG a partir de un `rgb(...)` computado. */
function luminance(css: string): number {
    const m = css.match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3) throw new Error(`color no parseable: ${css}`);
    const [r, g, b] = m.slice(0, 3).map((v) => {
        const c = Number(v) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: string, bg: string): number {
    const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
    return (hi + 0.05) / (lo + 0.05);
}

/** Sube por el DOM hasta encontrar un fondo no transparente. */
async function effectiveContrast(page: Page, selector: string): Promise<number> {
    const pair = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const color = getComputedStyle(el).color;
        let node: Element | null = el;
        while (node) {
            const bg = getComputedStyle(node).backgroundColor;
            if (bg && bg !== 'transparent' && !bg.startsWith('rgba(0, 0, 0, 0)')) {
                return { color, bg };
            }
            node = node.parentElement;
        }
        return { color, bg: 'rgb(255, 255, 255)' };
    }, selector);

    if (!pair) throw new Error(`no se encontró ${selector}`);
    return contrast(pair.color, pair.bg);
}

async function login(page: Page) {
    await page.goto('/admin/login');
    await page.getByPlaceholder(/correo|email/i).fill(EMAIL!);
    await page.getByPlaceholder(/contraseña|password/i).fill(PASSWORD!);
    await page.getByRole('button', { name: /ingresar|iniciar|entrar/i }).click();
    await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30_000 });
}

test.describe('Contraste del panel admin', () => {
    test.skip(!EMAIL || !PASSWORD, 'faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD');

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('el título del dashboard cumple AA', async ({ page }) => {
        expect(await effectiveContrast(page, 'h1, h2, .mantine-Title-root')).toBeGreaterThanOrEqual(4.5);
    });

    test('las celdas de tabla cumplen AA', async ({ page }) => {
        await page.goto('/admin/cuidadores');
        await page.waitForSelector('td, .mantine-Table-td', { timeout: 20_000 });
        expect(await effectiveContrast(page, 'td, .mantine-Table-td')).toBeGreaterThanOrEqual(4.5);
    });

    test('ningún texto del panel queda casi negro sobre fondo oscuro', async ({ page }) => {
        // Aserción directa contra el bug original: #0f172a / #1a1a2e sobre oscuro.
        const oscuros = await page.evaluate(() => {
            const malos: string[] = [];
            document.querySelectorAll('.mantine-Text-root, .mantine-Title-root, td, th, label').forEach((el) => {
                const m = getComputedStyle(el).color.match(/\d+/g);
                if (!m) return;
                const [r, g, b] = m.slice(0, 3).map(Number);
                // Suma baja = casi negro. Sobre el panel oscuro es ilegible.
                if (r + g + b < 150) malos.push(`${el.tagName}.${el.className}: rgb(${r},${g},${b})`);
            });
            return malos;
        });
        expect(oscuros, `texto casi negro encontrado:\n${oscuros.join('\n')}`).toHaveLength(0);
    });
});
