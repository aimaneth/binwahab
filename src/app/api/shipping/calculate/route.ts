import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const shippingCalculationSchema = z.object({
  state: z.string(),
  orderValue: z.number(),
  orderWeight: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { state, orderValue, orderWeight = 0 } = shippingCalculationSchema.parse(body);

    // Map state to zone type
    const zoneType = state.toLowerCase().includes('sabah') || 
                    state.toLowerCase().includes('sarawak') ? 
                    'EAST_MALAYSIA' : 'WEST_MALAYSIA';

    // Get shipping zone
    const zone = await prisma.shippingZone.findFirst({
      where: {
        type: zoneType,
        isActive: true,
      },
    });

    if (!zone) {
      return NextResponse.json({ cost: 0 });
    }

    // Get applicable shipping rate
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

    return NextResponse.json({ cost: rate?.price || 0 });
  } catch (error) {
    console.error("[SHIPPING_CALCULATE]", error);
    return NextResponse.json(
      { message: "Failed to calculate shipping" },
      { status: 500 }
    );
  }
} 