import { NextResponse } from "next/server";
import { adminFetch } from "@/lib/admin";
import { isTreatmentRevenueItem } from "@/lib/treatments";

interface MoneySet {
  shopMoney: { amount: string; currencyCode: string };
}

interface LineNode {
  title: string;
  quantity: number;
  sku?: string | null;
  originalTotalSet?: MoneySet;
  discountedTotalSet?: MoneySet;
  product?: { productType?: string; tags?: string[] } | null;
}

interface OrderNode {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  totalPriceSet: MoneySet;
  customer: { firstName: string; lastName: string; email: string } | null;
  lineItems: { edges: { node: LineNode }[] };
}

function lineAmount(line: LineNode): number {
  const raw =
    line.discountedTotalSet?.shopMoney.amount ||
    line.originalTotalSet?.shopMoney.amount ||
    "0";
  return parseFloat(raw) || 0;
}

function lineKind(line: LineNode): "behandeling" | "product" {
  return isTreatmentRevenueItem({
    title: line.title,
    productType: line.product?.productType,
    tags: line.product?.tags,
    sku: line.sku || undefined,
    barcode: line.sku || undefined,
  })
    ? "behandeling"
    : "product";
}

function emptySplit() {
  return { producten: 0, behandelingen: 0, countProducten: 0, countBehandelingen: 0 };
}

function addSplit(
  acc: ReturnType<typeof emptySplit>,
  order: OrderNode
) {
  for (const { node } of order.lineItems.edges) {
    const amount = lineAmount(node);
    if (lineKind(node) === "behandeling") {
      acc.behandelingen += amount;
      acc.countBehandelingen += node.quantity;
    } else {
      acc.producten += amount;
      acc.countProducten += node.quantity;
    }
  }
}

export async function GET() {
  try {
    const { data } = await adminFetch(`{
      orders(first: 100, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            customer { firstName lastName email }
            lineItems(first: 30) {
              edges {
                node {
                  title
                  quantity
                  sku
                  originalTotalSet { shopMoney { amount } }
                  discountedTotalSet { shopMoney { amount } }
                  product { productType tags }
                }
              }
            }
          }
        }
      }
    }`);

    const orders: OrderNode[] = data.orders.edges.map(
      (e: { node: OrderNode }) => e.node
    );

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const calcTotal = (list: OrderNode[]) =>
      list.reduce((sum, o) => sum + parseFloat(o.totalPriceSet.shopMoney.amount), 0);

    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= todayStart);
    const weekOrders = orders.filter((o) => new Date(o.createdAt) >= weekStart);
    const monthOrders = orders.filter((o) => new Date(o.createdAt) >= monthStart);

    const splitFor = (list: OrderNode[]) => {
      const acc = emptySplit();
      list.forEach((o) => addSplit(acc, o));
      return acc;
    };

    const byType = new Map<string, number>();
    for (const order of monthOrders) {
      for (const { node } of order.lineItems.edges) {
        const type =
          lineKind(node) === "behandeling"
            ? "Behandelingen"
            : node.product?.productType?.trim() || "Producten";
        byType.set(type, (byType.get(type) || 0) + lineAmount(node));
      }
    }

    return NextResponse.json({
      orders: orders.map((o) => ({
        ...o,
        categorySplit: (() => {
          const acc = emptySplit();
          addSplit(acc, o);
          return acc;
        })(),
      })),
      stats: {
        today: { count: todayOrders.length, total: calcTotal(todayOrders) },
        week: { count: weekOrders.length, total: calcTotal(weekOrders) },
        month: { count: monthOrders.length, total: calcTotal(monthOrders) },
        allTime: { count: orders.length, total: calcTotal(orders) },
      },
      categoryStats: {
        today: splitFor(todayOrders),
        week: splitFor(weekOrders),
        month: splitFor(monthOrders),
        allTime: splitFor(orders),
      },
      monthByType: Array.from(byType.entries())
        .map(([label, total]) => ({ label, total }))
        .sort((a, b) => b.total - a.total),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fout bij ophalen bestellingen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
