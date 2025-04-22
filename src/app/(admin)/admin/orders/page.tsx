"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
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
  ChevronsRight
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
  const [isExactOrderIdSearch, setIsExactOrderIdSearch] = useState(false)

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/")
      return
    }

    fetchOrders()
  }, [session, router, activeTab, pagination.currentPage, pagination.limit])

  const fetchOrders = async () => {
    try {
      const searchParams = new URLSearchParams()
      if (activeTab !== "all") {
        searchParams.append("status", activeTab.toUpperCase())
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
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    // Reset pagination to first page when searching
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }))
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

  const getPaymentStatusColor = (status: Order["paymentStatus"]) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      case "REFUNDED":
        return "bg-gray-100 text-gray-800"
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

  const filteredOrders = orders
    .filter(order => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      const userEmail = order.user?.email?.toLowerCase() || "";
      const userName = order.user?.name?.toLowerCase() || "";
      const orderId = order.id.toLowerCase();
      const phone = order.shippingAddress?.phone?.toLowerCase() || "";
      const address = `${order.shippingAddress?.street} ${order.shippingAddress?.city} ${order.shippingAddress?.state} ${order.shippingAddress?.zipCode} ${order.shippingAddress?.country}`.toLowerCase();
      
      return (
        orderId.includes(searchLower) ||
        userName.includes(searchLower) ||
        userEmail.includes(searchLower) ||
        phone.includes(searchLower) ||
        address.includes(searchLower)
      );
    })
    .filter(ORDER_STATUS_TABS.find(tab => tab.id === activeTab)?.filter || (() => true))

  const getTabCount = (tabId: OrderTab) => {
    const tab = ORDER_STATUS_TABS.find(t => t.id === tabId)
    if (!tab) return 0
    return orders.filter(tab.filter).length
  }

  const handleRowClick = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`)
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
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage and track customer orders
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by ID, customer name, or email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={(value) => setActiveTab(value as OrderTab)}>
          <TabsList className="w-full justify-start">
            {ORDER_STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                {tab.icon}
                {tab.label}
                <Badge variant="secondary" className="ml-2">
                  {getTabCount(tab.id)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {ORDER_STATUS_TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {tab.icon}
                    {tab.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              No orders found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredOrders.map((order) => (
                            <TableRow 
                              key={order.id}
                              onClick={() => handleRowClick(order.id)}
                              className="cursor-pointer hover:bg-muted/50 transition-colors group"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                #{order.id}
                                  {order.id.toLowerCase() === searchQuery.toLowerCase() && (
                                    <Badge variant="secondary">Exact Match</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{order.user.name || 'Guest User'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {order.user.email}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}, {order.shippingAddress.country}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(new Date(order.createdAt), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`flex w-fit items-center gap-1 ${getStatusColor(
                                    order.status
                                  )}`}
                                >
                                  {getStatusIcon(order.status)}
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={getPaymentStatusColor(
                                    order.paymentStatus
                                  )}
                                >
                                  {order.paymentStatus}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatPrice(order.total)}</TableCell>
                              <TableCell 
                                className="text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(`/admin/orders/${order.id}`)
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View details
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{" "}
                      {pagination.total} results
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <select
                          className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                          value={pagination.limit}
                          onChange={(e) => {
                            setPagination(prev => ({
                              ...prev,
                              limit: Number(e.target.value),
                              currentPage: 1
                            }))
                          }}
                        >
                          {[10, 20, 30, 40, 50].map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                              {pageSize}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setPagination(prev => ({
                              ...prev,
                              currentPage: 1
                            }))
                          }}
                          disabled={!pagination.hasPrevPage}
                        >
                          <span className="sr-only">Go to first page</span>
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setPagination(prev => ({
                              ...prev,
                              currentPage: prev.currentPage - 1
                            }))
                          }}
                          disabled={!pagination.hasPrevPage}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setPagination(prev => ({
                              ...prev,
                              currentPage: prev.currentPage + 1
                            }))
                          }}
                          disabled={!pagination.hasNextPage}
                        >
                          <span className="sr-only">Go to next page</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setPagination(prev => ({
                              ...prev,
                              currentPage: prev.totalPages
                            }))
                          }}
                          disabled={!pagination.hasNextPage}
                        >
                          <span className="sr-only">Go to last page</span>
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
} 