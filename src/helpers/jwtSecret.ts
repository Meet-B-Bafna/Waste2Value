// JWT secret. Falls back to a development-only secret so login works out of the box.
// Set NEXT_PUBLIC_JWT_TOKEN in .env.local for anything beyond local demos.
export const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_TOKEN || "wasteeasy-dev-secret-change-me";
