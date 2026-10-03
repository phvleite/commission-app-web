/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['pdfkit'],
    outputFileTracingIncludes: {
        '/api/pdf/**': ['./node_modules/pdfkit/js/data/**/*'],
    },
}

export default nextConfig
