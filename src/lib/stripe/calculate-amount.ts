interface OrderItem {
  price: number;
  quantity: number;
}

export function calculateOrderAmount(items: OrderItem[]): number {
  return items.reduce((total, item) => {
    return total + (item.price * 100 * (item.quantity || 1));
  }, 0);
} 