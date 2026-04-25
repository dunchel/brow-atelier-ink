import { NextRequest, NextResponse } from "next/server";
import { adminFetch } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const statusFilter = req.nextUrl.searchParams.get("status") || "all";

  try {
    const fulfillmentFilter = statusFilter !== "all"
      ? `, query: "fulfillment_status:${statusFilter}"`
      : "";

    const { data } = await adminFetch(`{
      orders(first: 50, sortKey: CREATED_AT, reverse: true${fulfillmentFilter}) {
        edges {
          node {
            id
            name
            createdAt
            displayFulfillmentStatus
            shippingAddress {
              name
              address1
              city
              zip
              country
            }
            customer { firstName lastName email }
            fulfillments {
              trackingInfo { number url company }
              status
              createdAt
            }
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
    return NextResponse.json({ orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fout bij ophalen zendingen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
