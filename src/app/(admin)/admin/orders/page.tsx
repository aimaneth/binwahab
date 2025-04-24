"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import debounce from 'lodash/debounce'
import { 
  Package, 
  Search, 
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  AlertCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatPrice } from "@/lib/utils"

interface Order {
  id: string
  user: {
    id: string
    name: string | null
    email: string | null
  }
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
  total: number
  items: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
    }
    variant?: {
      name: string
      images: string[]
      options: Record<string, string>
    } | null
  }[]
  _count?: {
    items: number
  }
  paymentMethod: "CREDIT_CARD" | "DEBIT_CARD" | "BANK_TRANSFER" | "E_WALLET"
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
  createdAt: string
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    phone: string
  }
}

interface PaginatedResponse {
  orders: Order[]
  pagination: {
    total: number
    totalPages: number
    currentPage: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

type OrderTab = "all" | "unpaid" | "to-ship" | "shipping" | "completed" | "returns"

interface OrderStatusTab {
  id: OrderTab
  label: string
  icon: React.ReactNode
  filter: (order: Order) => boolean
}

const ORDER_STATUS_TABS: OrderStatusTab[] = [
  {
    id: "all",
    label: "All Orders",
    icon: <Package className="h-4 w-4" />,
    filter: () => true
  },
  {
    id: "unpaid",
    label: "Unpaid",
    icon: <AlertCircle className="h-4 w-4" />,
    filter: (order) => order.paymentStatus === "PENDING"
  },
  {
    id: "to-ship",
    label: "To Ship",
    icon: <Package className="h-4 w-4" />,
    filter: (order) => order.paymentStatus === "PAID" && order.status === "PROCESSING"
  },
  {
    id: "shipping",
    label: "Shipping",
    icon: <Truck className="h-4 w-4" />,
    filter: (order) => order.status === "SHIPPED"
  },
  {
    id: "completed",
    label: "Completed",
    icon: <CheckCircle2 className="h-4 w-4" />,
    filter: (order) => order.status === "DELIVERED"
  },
  {
    id: "returns",
    label: "Returns/Refunds",
    icon: <RotateCcw className="h-4 w-4" />,
    filter: (order) => order.status === "CANCELLED" || order.paymentStatus === "REFUNDED"
  }
]

export default function OrdersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginatedResponse["pagination"]>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  })

  // Memoized fetch function
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams()
      if (activeTab !== "all") {
        searchParams.append("status", activeTab.toUpperCase())
      }
      if (searchQuery) {
        searchParams.append("search", searchQuery)
      }
      searchParams.append("page", pagination.currentPage.toString())
      searchParams.append("limit", pagination.limit.toString())
      
      const response = await fetch(`/api/admin/orders?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch orders")
      const data: PaginatedResponse = await response.json()
      setOrders(data.orders)
      setPagination(data.pagination)
    } catch (error) {
      toast.error("Failed to load orders")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, pagination.currentPage, pagination.limit, searchQuery])

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value)
        setPagination(prev => ({
          ...prev,
          currentPage: 1
        }))
      }, 300),
    []
  )

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/")
      return
    }

    fetchOrders()
  }, [session, router, fetchOrders])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

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

  const handleRowClick = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`)
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm space-y-3">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              className="pl-10 w-[300px]"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          {ORDER_STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>Order List</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-6">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No orders found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(order.id)}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.user.name}</p>
                            <p className="text-sm text-muted-foreground">{order.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatPrice(order.total)}</TableCell>
                        <TableCell>{order._count?.items || 0} items</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {orders.length} of {pagination.total} orders
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: 1 }))}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={!pagination.hasNextPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: pagination.totalPages }))}
                  disabled={!pagination.hasNextPage}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
} 