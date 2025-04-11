import { prisma } from "@/lib/prisma";

interface ShippingCalculationParams {
  zoneId: string;
  orderValue: number;
  orderWeight: number;
}

export async function calculateShippingCost({
  zoneId,
  orderValue,
  orderWeight,
}: ShippingCalculationParams) {
  try {
    // Get all active shipping rates for the zone
    const rates = await prisma.shippingRate.findMany({
      where: {
        zoneId,
        isActive: true,
      },
      orderBy: {
        price: "asc",
      },
    });

    // Find the first rate that matches the order criteria
    const applicableRate = rates.find((rate) => {
      const matchesOrderValue =
        (!rate.minOrderValue || orderValue >= rate.minOrderValue) &&
        (!rate.maxOrderValue || orderValue <= rate.maxOrderValue);

      const matchesWeight =
        (!rate.minWeight || orderWeight >= rate.minWeight) &&
        (!rate.maxWeight || orderWeight <= rate.maxWeight);

      return matchesOrderValue && matchesWeight;
    });

    return applicableRate?.price || 0;
  } catch (error) {
    console.error("Error calculating shipping cost:", error);
    return 0;
  }
}

export async function getShippingZoneByState(state: string) {
  // Map Malaysian states to shipping zones
  const stateZoneMap: Record<string, "WEST_MALAYSIA" | "EAST_MALAYSIA"> = {
    // West Malaysia
    "Johor": "WEST_MALAYSIA",
    "Kedah": "WEST_MALAYSIA",
    "Kelantan": "WEST_MALAYSIA",
    "Melaka": "WEST_MALAYSIA",
    "Negeri Sembilan": "WEST_MALAYSIA",
    "Pahang": "WEST_MALAYSIA",
    "Perak": "WEST_MALAYSIA",
    "Perlis": "WEST_MALAYSIA",
    "Pulau Pinang": "WEST_MALAYSIA",
    "Selangor": "WEST_MALAYSIA",
    "Terengganu": "WEST_MALAYSIA",
    "Kuala Lumpur": "WEST_MALAYSIA",
    "Putrajaya": "WEST_MALAYSIA",
    // East Malaysia
    "Sabah": "EAST_MALAYSIA",
    "Sarawak": "EAST_MALAYSIA",
    "Labuan": "EAST_MALAYSIA",
  };

  const zoneType = stateZoneMap[state];
  if (!zoneType) return null;

  const zone = await prisma.shippingZone.findFirst({
    where: {
      type: zoneType,
      isActive: true,
    },
  });

  return zone;
} 