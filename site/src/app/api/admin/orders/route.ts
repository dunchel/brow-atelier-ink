import { NextResponse } from "next/server";
import { adminFetch } from "@/lib/admin";

export async function GET() {
  try {
    const { data } = await adminFetch(`{
      orders(first: 50, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            customer { firstName lastName email }
            lineItems(first: 10) {
              edges {
                node { title quantity }
              }
            }
          }
        }
      }
    }`);

    const orders = data.orders.edges.map((e: { node: Record<string, unknown> }) => e.node);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const calcTotal = (list: { totalPriceSet: { shopMoney: { amount: string } } }[]) =>
      list.reduce((sum, o) => sum + parseFloat(o.totalPriceSet.shopMoney.amount), 0);

    const todayOrders = orders.filter((o: { createdAt: string }) => new Date(o.createdAt) >= todayStart);
    const weekOrders = orders.filter((o: { createdAt: string }) => new Date(o.createdAt) >= weekStart);
    const monthOrders = orders.filter((o: { createdAt: string }) => new Date(o.createdAt) >= monthStart);

    return NextResponse.json({
      orders,
      stats: {
        today: { count: todayOrders.length, total: calcTotal(todayOrders) },
        week: { count: weekOrders.length, total: calcTotal(weekOrders) },
        month: { count: monthOrders.length, total: calcTotal(monthOrders) },
        allTime: { count: orders.length, total: calcTotal(orders) },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fout bij ophalen bestellingen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
