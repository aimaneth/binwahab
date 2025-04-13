import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ProductVariant } from "@prisma/client";
import { format } from "date-fns";

interface VariantAnalyticsProps {
  variant: ProductVariant;
}

interface AnalyticsData {
  sales: {
    date: string;
    quantity: number;
    revenue: number;
  }[];
  inventory: {
    date: string;
    stock: number;
    type: string;
  }[];
  metrics: {
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    stockTurnoverRate: number;
  };
}

export function VariantAnalytics({ variant }: VariantAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/products/variants/${variant.id}/analytics?timeframe=${timeframe}`
        );
        if (!response.ok) throw new Error("Failed to fetch analytics");
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [variant.id, timeframe]);

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  if (!data) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Variant Analytics</h3>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as "7d" | "30d" | "90d")}
          className="border rounded-md p-1"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <Label>Total Sales</Label>
          <div className="text-2xl font-bold">{data.metrics.totalSales}</div>
        </Card>
        <Card className="p-4">
          <Label>Total Revenue</Label>
          <div className="text-2xl font-bold">
            ${data.metrics.totalRevenue.toFixed(2)}
          </div>
        </Card>
        <Card className="p-4">
          <Label>Average Order Value</Label>
          <div className="text-2xl font-bold">
            ${data.metrics.averageOrderValue.toFixed(2)}
          </div>
        </Card>
        <Card className="p-4">
          <Label>Stock Turnover Rate</Label>
          <div className="text-2xl font-bold">
            {data.metrics.stockTurnoverRate.toFixed(2)}x
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-4">
          <Label>Sales Over Time</Label>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="quantity"
                  stroke="#8884d8"
                  name="Quantity"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <Label>Inventory History</Label>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.inventory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                />
                <Line
                  type="stepAfter"
                  dataKey="stock"
                  stroke="#8884d8"
                  name="Stock Level"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
} 