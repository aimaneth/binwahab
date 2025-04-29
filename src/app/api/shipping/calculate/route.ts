import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const shippingCalculationSchema = z.object({
  state: z.string(),
  orderValue: z.number(),
  orderWeight: z.number().optional(),
});

const DEFAULT_SHIPPING_COST = {
  'WEST_MALAYSIA': 10.00,
  'EAST_MALAYSIA': 15.00
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[SHIPPING_CALC_REQUEST]", { body });

    const { state, orderValue, orderWeight = 0 } = shippingCalculationSchema.parse(body);
    console.log("[SHIPPING_CALC_PARSED]", { state, orderValue, orderWeight });

    // Check if free shipping is enabled
    const freeShippingSetting = await prisma.systemSetting.findUnique({
      where: { key: 'free_shipping_enabled' }
    });

    // If free shipping is enabled, return 0 cost
    if (freeShippingSetting?.value === 'true') {
      console.log("[SHIPPING_CALC_RESPONSE]", { cost: 0, source: 'free_shipping_setting' });
      return NextResponse.json({ cost: 0 });
    }

    // Map state to zone type
    const zoneType = state.toLowerCase().includes('sabah') || 
                    state.toLowerCase().includes('sarawak') ? 
                    'EAST_MALAYSIA' : 'WEST_MALAYSIA';
    
    console.log("[SHIPPING_CALC_ZONE]", { state, zoneType });

    try {
      // Get shipping zone
      const zone = await prisma.shippingZone.findFirst({
        where: {
          type: zoneType,
          isActive: true,
        },
      });

      console.log("[SHIPPING_CALC_ZONE_QUERY]", { zone });

      // Get applicable shipping rate if zone exists
      if (zone) {
        const rate = await prisma.shippingRate.findFirst({
          where: {
            zoneId: zone.id,
            isActive: true,
            AND: [
              {
                OR: [
                  { minOrderValue: null },
                  { minOrderValue: { lte: orderValue } }
                ]
              },
              {
                OR: [
                  { maxOrderValue: null },
                  { maxOrderValue: { gte: orderValue } }
                ]
              },
              {
                OR: [
                  { minWeight: null },
                  { minWeight: { lte: orderWeight } }
                ]
              },
              {
                OR: [
                  { maxWeight: null },
                  { maxWeight: { gte: orderWeight } }
                ]
              }
            ]
          },
          orderBy: {
            price: 'asc'
          }
        });

        console.log("[SHIPPING_CALC_RATE_QUERY]", { rate });

        if (rate) {
          const cost = Number(rate.price);
          console.log("[SHIPPING_CALC_RESPONSE]", { cost, source: 'database' });
          return NextResponse.json({ cost });
        }
      }

      // If no shipping zone or rate found, use default cost
      const defaultCost = DEFAULT_SHIPPING_COST[zoneType];
      console.log("[SHIPPING_CALC_RESPONSE]", { cost: defaultCost, source: 'default' });
      return NextResponse.json({ cost: defaultCost });

    } catch (dbError) {
      console.error("[SHIPPING_CALC_DB_ERROR]", {
        error: dbError,
        stack: dbError instanceof Error ? dbError.stack : undefined
      });
      // Fallback to default shipping cost if database query fails
      const defaultCost = DEFAULT_SHIPPING_COST[zoneType];
      console.log("[SHIPPING_CALC_RESPONSE]", { cost: defaultCost, source: 'fallback' });
      return NextResponse.json({ cost: defaultCost });
    }
  } catch (error) {
    console.error("[SHIPPING_CALC_ERROR]", {
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to calculate shipping" },
      { status: 500 }
    );
  }
} 