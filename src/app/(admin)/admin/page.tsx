"use client";

import { useEffect, useState } from "react";
import { BarChart, Package, ShoppingCart, Users, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";

interface DashboardData {
  stats: {
    revenue: {
      current: number;
      change: number;
    };
    products: {
      total: number;
      change: number;
    };
    orders: {
      current: number;
      change: number;
    };
    customers: {
      total: number;
      new: number;
    };
    collections: {
      total: number;
      active: number;
    };
  };
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
    user: {
      name: string | null;
      email: string;
    };
    items: Array<{
      product: {
        name: string;
      };
    }>;
  }>;
  topProducts: Array<{
    name: string;
    price: number;
    image: string | null;
    totalSold: number;
  }>;
  topCollections: Array<{
    name: string;
    productCount: number;
    totalRevenue: number;
  }>;
  salesByDay: Array<{
    date: string;
    total: number;
  }>;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const formatTooltipDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard");
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Revenue",
      value: formatPrice(data.stats.revenue.current),
      change: `${data.stats.revenue.change.toFixed(1)}%`,
      changeType: data.stats.revenue.change >= 0 ? "positive" : "negative",
      icon: DollarSign,
    },
    {
      name: "Total Products",
      value: data.stats.products.total.toString(),
      change: `${data.stats.products.change.toFixed(1)}%`,
      changeType: data.stats.products.change >= 0 ? "positive" : "negative",
      icon: Package,
    },
    {
      name: "Total Orders",
      value: data.stats.orders.current.toString(),
      change: `${data.stats.orders.change.toFixed(1)}%`,
      changeType: data.stats.orders.change >= 0 ? "positive" : "negative",
      icon: ShoppingCart,
    },
    {
      name: "Total Customers",
      value: data.stats.customers.total.toString(),
      new: data.stats.customers.new,
      icon: Users,
    },
    {
      name: "Collections",
      value: data.stats.collections.total.toString(),
      active: data.stats.collections.active,
      icon: BarChart,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your admin dashboard. Here's an overview of your store.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => {
              const now = new Date();
              const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              const startDate = thirtyDaysAgo.toISOString().split('T')[0];
              const endDate = now.toISOString().split('T')[0];
              window.open(`/api/admin/reports?startDate=${startDate}&endDate=${endDate}`, "_blank");
            }}
          >
            Download Report
          </Button>
          <Button onClick={() => router.push("/admin/analytics")}>
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <p className={`text-xs ${stat.changeType === "positive" ? "text-green-500" : "text-red-500"}`}>
                  {stat.change} from last month
                </p>
              )}
              {stat.new && (
                <p className="text-xs text-green-500">
                  +{stat.new} new this month
                </p>
              )}
              {stat.active && (
                <p className="text-xs text-muted-foreground">
                  {stat.active} active collections
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    className="text-xs text-muted-foreground"
                  />
                  <YAxis 
                    tickFormatter={(value) => formatPrice(value)}
                    className="text-xs text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatPrice(value), "Sales"]}
                    labelFormatter={formatTooltipDate}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topCollections.map((collection, index) => (
                <div key={index} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {collection.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {collection.productCount} products
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {formatPrice(collection.totalRevenue)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {order.user.name || order.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.items.map((item) => item.product.name).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 