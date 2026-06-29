import type { MetadataRoute } from 'next';

const BASE_URL = 'https://carebydani.com.ar';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: BASE_URL,
            lastModified: '2025-06-01',
            changeFrequency: 'monthly',
            priority: 1,
        },
        {
            url: `${BASE_URL}/#servicios`,
            lastModified: '2025-06-01',
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/#nosotros`,
            lastModified: '2025-06-01',
            changeFrequency: 'yearly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/#contacto`,
            lastModified: '2025-06-01',
            changeFrequency: 'yearly',
            priority: 0.7,
        },
    ];
}
