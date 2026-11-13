import type { MetadataRoute } from 'next';

const BASE_URL = 'https://carebydani.com.ar';

// Única página pública. Las secciones (#servicios, #nosotros, #contacto) no van:
// Google ignora el fragmento y las marcaba como duplicadas de la home.
export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: `${BASE_URL}/`,
            lastModified: '2025-06-01',
            changeFrequency: 'monthly',
            priority: 1,
        },
    ];
}
