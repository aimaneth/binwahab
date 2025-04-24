"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Package, Truck, CheckCircle2, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatOrderId } from "@/lib/utils"

interface Order {
  id: string
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
  total: number
  items: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
      image: string | null
    }
    variant?: {
      name: string
      images: string[]
      options: Record<string, string>
    } | null
  }[]
  createdAt: string
  updatedAt: string
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      router.push("/login")
      return
    }

    fetchOrders()
    setupOrderUpdates()
  }, [session, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders")
      if (!response.ok) throw new Error("Failed to fetch orders")
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      toast.error("Failed to load orders")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const setupOrderUpdates = () => {
    const eventSource = new EventSource("/api/orders/updates")

    eventSource.onmessage = (event) => {
      const updatedOrders = JSON.parse(event.data)
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          const updatedOrder = updatedOrders.find((o: Order) => o.id === order.id)
          return updatedOrder ? { ...order, ...updatedOrder } : order
        })
      )
    }

    eventSource.onerror = () => {
      eventSource.close()
      // Attempt to reconnect after a delay
      setTimeout(setupOrderUpdates, 5000)
    }

    return () => {
      eventSource.close()
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "PROCESSING":
        return "bg-blue-100 text-blue-800"
      case "SHIPPED":
        return "bg-purple-100 text-purple-800"
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "PROCESSING":
        return <Package className="h-4 w-4" />
      case "SHIPPED":
        return <Truck className="h-4 w-4" />
      case "DELIVERED":
        return <CheckCircle2 className="h-4 w-4" />
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground">
            Track and manage your orders
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Order {formatOrderId(order.id)}</CardTitle>
                <Badge
                  variant="secondary"
                  className={`${getStatusColor(order.status)} flex items-center gap-1`}
                >
                  {getStatusIcon(order.status)}
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Date</span>
                  <span>{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(order.updatedAt), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{formatPrice(order.total)}</span>
                </div>
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Items</h3>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{item.product.name}</p>
                          {item.variant && (
                            <p className="text-xs text-muted-foreground">
                              {Object.entries(item.variant.options)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(", ")}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(item.price)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 