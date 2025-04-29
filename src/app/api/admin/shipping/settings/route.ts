import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for validating shipping settings
const shippingSettingsSchema = z.object({
  freeShippingEnabled: z.boolean(),
});

type ShippingSettings = z.infer<typeof shippingSettingsSchema>;

// Convert database settings to API format
function mapSettingsFromDb(settings: { key: string; value: string }[]): ShippingSettings {
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    freeShippingEnabled: settingsMap['free_shipping_enabled'] === 'true',
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const settings = await prisma.systemSetting.findMany({
      where: {
        key: 'free_shipping_enabled',
      },
    });

    // If the setting doesn't exist, create it with default value
    if (settings.length === 0) {
      await prisma.systemSetting.create({
        data: {
          key: 'free_shipping_enabled',
          value: 'false',
        },
      });
      return NextResponse.json({
        freeShippingEnabled: false,
      });
    }

    return NextResponse.json(mapSettingsFromDb(settings));
  } catch (error) {
    console.error("[SHIPPING_SETTINGS_GET]", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = shippingSettingsSchema.parse(body);

    // Update the free shipping setting
    await prisma.systemSetting.upsert({
      where: { key: 'free_shipping_enabled' },
      update: { value: validatedData.freeShippingEnabled.toString() },
      create: { 
        key: 'free_shipping_enabled', 
        value: validatedData.freeShippingEnabled.toString() 
      },
    });

    return NextResponse.json({
      freeShippingEnabled: validatedData.freeShippingEnabled,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("[SHIPPING_SETTINGS_PATCH]", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 