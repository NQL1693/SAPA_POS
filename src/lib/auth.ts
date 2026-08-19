import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME =
  "pink-coffee-session";

function getSecret() {
  const secret =
    process.env.POS_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "Thiếu POS_SESSION_SECRET trong .env.local"
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken() {
  return new SignJWT({
    authenticated: true,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("10y")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
) {
  try {
    const { payload } =
      await jwtVerify(
        token,
        getSecret()
      );

    return (
      payload.authenticated === true
    );
  } catch {
    return false;
  }
}