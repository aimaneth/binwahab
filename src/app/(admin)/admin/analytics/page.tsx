"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/utils/format";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { addDays, format, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DateRange } from "react-day-picker";

interface AnalyticsData {
  period: {
    start: string;
    end: string;
  };
  salesByDay: Array<{
    date: string;
    total: number;
  }>;
  salesByCategory: Array<{
    category: string;
    total: number;
    formattedTotal: string;
  }>;
  customersByDay: Array<{
    date: string;
    count: number;
  }>;
  topProducts: Array<{
    name: string;
    category: string;
    totalSold: number;
    revenue: string;
    image: string | null;
  }>;
  collections: Array<{
    id: string;
    name: string;
    type: string;
    totalViews: number;
    totalClicks: number;
    totalConversions: number;
    averageClickThroughRate: number;
    averageConversionRate: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const defaultStart = subDays(new Date(), 30);
        const defaultEnd = new Date();
        const startDate = format(dateRange?.from as Date || defaultStart, "yyyy-MM-dd");
        const endDate = format(dateRange?.to as Date || defaultEnd, "yyyy-MM-dd");
        
        const response = await fetch(`/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) throw new Error("Failed to fetch analytics data");
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error Loading Analytics</h2>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM d");
  };

  const formatTooltipDate = (date: string) => {
    return format(new Date(date), "MMMM d, yyyy");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into your store's performance.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            align="end"
          />
          <Button variant="outline" onClick={() => {
            if (!dateRange.from || !dateRange.to) return;
            const startDate = format(dateRange.from, "yyyy-MM-dd");
            const endDate = format(dateRange.to, "yyyy-MM-dd");
            window.open(`/api/admin/reports?startDate=${startDate}&endDate=${endDate}`, "_blank");
          }}>
            Download Report
          </Button>
        </div>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={formatTooltipDate}
                  formatter={(value: number) => [formatPrice(value), "Sales"]}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.salesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="category"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {data.salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatPrice(value), "Sales"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Acquisition */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.customersByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={formatTooltipDate}
                    formatter={(value: number) => [value, "New Customers"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topProducts.map((product) => (
              <div
                key={product.name}
                className="flex items-center space-x-4"
              >
                <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover rounded-md"
                    />
                  ) : (
                    <span className="text-muted-foreground">No image</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{product.revenue}</p>
                  <p className="text-sm text-muted-foreground">{product.totalSold} sold</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collection Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.collections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{collection.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {collection.type === "MANUAL" ? "Manual Collection" : "Automated Collection"}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-4 text-right">
                  <div>
                    <p className="font-medium">{collection.totalViews.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Views</p>
                  </div>
                  <div>
                    <p className="font-medium">{collection.totalClicks.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Clicks</p>
                  </div>
                  <div>
                    <p className="font-medium">{collection.totalConversions.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                  </div>
                  <div>
                    <p className="font-medium">{collection.averageConversionRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Conv. Rate</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 