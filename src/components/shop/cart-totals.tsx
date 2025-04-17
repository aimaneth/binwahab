export function CartTotals() {
  return (
    <div className="bg-card rounded-lg shadow divide-y divide-border border border-border">
      <div className="p-6">
        <div className="flow-root">
          <dl className="-my-4 divide-y divide-border text-sm">
            <div className="flex items-center justify-between py-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">$99.00</dd>
            </div>
            <div className="flex items-center justify-between py-4">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-medium">Free</dd>
            </div>
            <div className="flex items-center justify-between py-4">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="font-medium">$0.00</dd>
            </div>
            <div className="flex items-center justify-between py-4">
              <dt className="font-medium">Order total</dt>
              <dd className="font-medium">$99.00</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
} 