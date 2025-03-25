/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar Turbopack para desarrollo
  experimental: {
    turbo: {},
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Asegurarse de que las imágenes externas estén permitidas
  images: {
    domains: ['localhost', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig

