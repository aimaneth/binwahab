import { prisma } from "@/lib/prisma";

/**
 * Ensures the free_shipping_enabled setting exists in the database
 * Call this function when the admin shipping settings page loads
 */
export async function ensureFreeShippingSettingExists() {
  try {
    // Check if the setting already exists
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key: 'free_shipping_enabled' }
    });

    // If setting doesn't exist, create it with default value 'false'
    if (!existingSetting) {
      await prisma.systemSetting.create({
        data: {
          key: 'free_shipping_enabled',
          value: 'false'
        }
      });
      console.log('Created free_shipping_enabled setting');
    }
  } catch (error) {
    console.error('Error ensuring free_shipping_enabled setting exists:', error);
  }
} 