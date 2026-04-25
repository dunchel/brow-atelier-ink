import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "browatelier.ink@gmail.com";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "eb240f905e899d845e50944b811a74f92d7a0c55cbebd75a37b8094e4504259e";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "brow-atelier-admin-secret-2026-xk9m";

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function createSessionToken(email: string) {
  const payload = `${email}:${Date.now()}:${SESSION_SECRET}`;
  return createHash("sha256").update(payload).digest("hex");
}

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

export async function POST(req: NextRequest) {
  try {
    const { action, email, password } = await req.json();

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "E-mail en wachtwoord zijn verplicht" }, { status: 400 });
      }

      if (email.trim() !== ADMIN_EMAIL.trim() || hashPassword(password) !== ADMIN_PASSWORD_HASH.trim()) {
        return NextResponse.json({ error: "Onjuiste inloggegevens" }, { status: 401 });
      }

      const token = createSessionToken(email);
      const response = NextResponse.json({ success: true });
      response.cookies.set("admin_session", token, cookieOptions);
      response.cookies.set("admin_email", email.trim(), cookieOptions);
      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      response.cookies.set("admin_session", "", { ...cookieOptions, maxAge: 0 });
      response.cookies.set("admin_email", "", { ...cookieOptions, maxAge: 0 });
      return response;
    }

    if (action === "check") {
      const session = req.cookies.get("admin_session")?.value;
      const adminEmail = req.cookies.get("admin_email")?.value;
      const isLoggedIn = !!session && adminEmail === ADMIN_EMAIL.trim();
      return NextResponse.json({ authenticated: isLoggedIn, email: isLoggedIn ? ADMIN_EMAIL : null });
    }

    return NextResponse.json({ error: "Ongeldige actie" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Er ging iets mis";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
