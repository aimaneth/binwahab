import { prisma } from '@/lib/prisma';
import { Return, ReturnItem, Order } from '@prisma/client';
import { ReturnWithRelations } from '../types/return';

export class ReturnLabelService {
  private static SHIPPING_PROVIDER_API_KEY = process.env.SHIPPING_PROVIDER_API_KEY;
  private static RETURN_ADDRESS = {
    name: process.env.RETURN_ADDRESS_NAME || "Your Store Name",
    street: process.env.RETURN_ADDRESS_STREET || "123 Return St",
    city: process.env.RETURN_ADDRESS_CITY || "Return City",
    state: process.env.RETURN_ADDRESS_STATE || "Return State",
    zipCode: process.env.RETURN_ADDRESS_ZIP || "12345",
    country: process.env.RETURN_ADDRESS_COUNTRY || "US",
    phone: process.env.RETURN_ADDRESS_PHONE || "123-456-7890"
  };

  static async generateReturnLabel(return_: ReturnWithRelations): Promise<string> {
    try {
      // Get customer's shipping address from the original order
      const order = await prisma.order.findUnique({
        where: { id: return_.orderId },
        include: { shippingAddress: true }
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Calculate package weight and dimensions
      const packageDetails = await this.calculatePackageDetails(return_.items);

      // Generate shipping label using shipping provider's API
      const label = await this.createShippingLabel({
        from: order.shippingAddress,
        to: this.RETURN_ADDRESS,
        package: packageDetails,
        returnId: return_.id,
        orderId: return_.orderId
      });

      // Store label URL in the database
      await prisma.return.update({
        where: { id: return_.id },
        data: {
          trackingNumber: label.trackingNumber,
          labelUrl: label.labelUrl
        }
      });

      return label.labelUrl;
    } catch (error) {
      console.error("Error generating return label:", error);
      throw error;
    }
  }

  private static async calculatePackageDetails(items: ReturnItem[]): Promise<{
    weight: number;
    length: number;
    width: number;
    height: number;
  }> {
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) continue;

      const dimensions = product.dimensions as { length: number; width: number; height: number } | null;
      const weight = product.weight || 0.5; // Default weight if not specified

      totalWeight += weight * item.quantity;
      
      if (dimensions) {
        maxLength = Math.max(maxLength, dimensions.length);
        maxWidth = Math.max(maxWidth, dimensions.width);
        totalHeight += dimensions.height * item.quantity;
      }
    }

    // Add padding for packaging
    return {
      weight: totalWeight + 0.5, // Add 0.5kg for packaging
      length: maxLength + 5, // Add 5cm padding
      width: maxWidth + 5,
      height: totalHeight + 5
    };
  }

  private static async createShippingLabel(params: {
    from: any;
    to: any;
    package: any;
    returnId: string;
    orderId: string;
  }): Promise<{ trackingNumber: string; labelUrl: string }> {
    // This is a mock implementation. Replace with actual shipping provider API call
    // Example: UPS, FedEx, USPS, etc.
    return {
      trackingNumber: `RET${params.returnId.slice(0, 8).toUpperCase()}`,
      labelUrl: `/api/returns/${params.returnId}/label`
    };
  }

  static async getReturnLabel(returnId: string): Promise<string | null> {
    const return_ = await prisma.return.findUnique({
      where: { id: returnId },
      select: { labelUrl: true }
    });

    return return_?.labelUrl || null;
  }

  static async updateTrackingStatus(returnId: string, trackingNumber: string, status: string): Promise<void> {
    await prisma.return.update({
      where: { id: returnId },
      data: {
        trackingNumber,
        trackingStatus: status,
        updatedAt: new Date()
      }
    });
  }
} 