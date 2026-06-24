import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Care By Dani — Cuidado de adultos mayores',
        short_name: 'Care By Dani',
        description:
            'Cuidadores profesionales y empáticos para adultos mayores en AMBA.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2C8894',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
