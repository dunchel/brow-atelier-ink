import { NextRequest, NextResponse } from "next/server";
import { loginCustomer, createCustomer, getCustomer, recoverCustomer, resetCustomerPassword } from "@/lib/customer";

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");
  const token = req.nextUrl.searchParams.get("token");

  if (action === "me" && token) {
    try {
      const customer = await getCustomer(token);
      return NextResponse.json({ customer });
    } catch {
      return NextResponse.json({ customer: null });
    }
  }

  return NextResponse.json({ error: "Ongeldige actie" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "login") {
      const { email, password } = body;
      const tokenData = await loginCustomer(email, password);
      const customer = await getCustomer(tokenData.accessToken);
      return NextResponse.json({
        accessToken: tokenData.accessToken,
        customer: customer
          ? { firstName: customer.firstName, lastName: customer.lastName, email: customer.email }
          : null,
      });
    }

    if (action === "register") {
      const { email, password, firstName, lastName } = body;
      await createCustomer(email, password, firstName, lastName);
      const tokenData = await loginCustomer(email, password);
      const customer = await getCustomer(tokenData.accessToken);
      return NextResponse.json({
        accessToken: tokenData.accessToken,
        customer: customer
          ? { firstName: customer.firstName, lastName: customer.lastName, email: customer.email }
          : null,
      });
    }

    if (action === "recover") {
      const { email } = body;
      await recoverCustomer(email);
      return NextResponse.json({ success: true });
    }

    if (action === "resetPassword") {
      const { customerId, resetToken, password } = body;
      const tokenData = await resetCustomerPassword(customerId, resetToken, password);
      return NextResponse.json({ success: true, accessToken: tokenData.accessToken });
    }

    return NextResponse.json({ error: "Ongeldige actie" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Er ging iets mis";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
