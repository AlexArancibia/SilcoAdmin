import { jwtVerify, SignJWT } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

if (!JWT_SECRET) {
  console.warn("JWT_SECRET not set in environment variables. Using default secret.")
}

export async function signJWT(payload: any) {
  const secret = new TextEncoder().encode(JWT_SECRET)

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret)

  return token
}

export async function verifyJWT<T>(token: string): Promise<T> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload as T
  } catch (error) {
    throw new Error("Invalid token")
  }
}

