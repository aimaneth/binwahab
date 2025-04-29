"use client";

import { useState, useEffect } from "react";
import { ShippingRate, ShippingZone } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ShippingRateForm } from "./rate-form";
import { ShippingZoneForm } from "./zone-form";
import { ShippingRatesTable } from "./rates-table";
import { ShippingZonesTable } from "./zones-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShippingSettingsForm } from "./settings-form";

export default function ShippingPage() {
  const [activeTab, setActiveTab] = useState("settings");
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [rates, setRates] = useState<(ShippingRate & { zone: ShippingZone })[]>([]);
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);

  useEffect(() => {
    fetchZones();
    fetchRates();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await fetch("/api/admin/shipping/zones");
      if (!response.ok) throw new Error("Failed to fetch zones");
      const data = await response.json();
      setZones(data);
    } catch (error) {
      toast.error("Failed to load shipping zones");
    }
  };

  const fetchRates = async () => {
    try {
      const response = await fetch("/api/admin/shipping/rates");
      if (!response.ok) throw new Error("Failed to fetch rates");
      const data = await response.json();
      setRates(data);
    } catch (error) {
      toast.error("Failed to load shipping rates");
    }
  };

  const handleZoneSubmit = async (data: any) => {
    try {
      const url = selectedZone
        ? `/api/admin/shipping/zones/${selectedZone.id}`
        : "/api/admin/shipping/zones";
      const method = selectedZone ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save zone");

      toast.success(
        `Shipping zone ${selectedZone ? "updated" : "created"} successfully`
      );
      setShowZoneForm(false);
      fetchZones();
    } catch (error) {
      toast.error("Failed to save shipping zone");
    }
  };

  const handleRateSubmit = async (data: any) => {
    try {
      const url = selectedRate
        ? `/api/admin/shipping/rates/${selectedRate.id}`
        : "/api/admin/shipping/rates";
      const method = selectedRate ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save rate");

      toast.success(
        `Shipping rate ${selectedRate ? "updated" : "created"} successfully`
      );
      setShowRateForm(false);
      fetchRates();
    } catch (error) {
      toast.error("Failed to save shipping rate");
    }
  };

  const handleDeleteZone = async (zone: ShippingZone) => {
    if (!confirm("Are you sure you want to delete this zone?")) return;

    try {
      const response = await fetch(`/api/admin/shipping/zones/${zone.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete zone");

      toast.success("Shipping zone deleted successfully");
      fetchZones();
    } catch (error) {
      toast.error("Failed to delete shipping zone");
    }
  };

  const handleDeleteRate = async (rate: ShippingRate) => {
    if (!confirm("Are you sure you want to delete this rate?")) return;

    try {
      const response = await fetch(`/api/admin/shipping/rates/${rate.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete rate");

      toast.success("Shipping rate deleted successfully");
      fetchRates();
    } catch (error) {
      toast.error("Failed to delete shipping rate");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Shipping Management</h1>
        {activeTab !== "settings" && (
          <Button
            onClick={() => {
              if (activeTab === "zones") {
                setSelectedZone(null);
                setShowZoneForm(true);
              } else {
                setSelectedRate(null);
                setShowRateForm(true);
              }
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {activeTab === "zones" ? "Zone" : "Rate"}
          </Button>
        )}
      </div>

      <Tabs 
        defaultValue="settings" 
        value={activeTab} 
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
          <TabsTrigger value="rates">Shipping Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <ShippingSettingsForm />
        </TabsContent>

        <TabsContent value="zones">
          <ShippingZonesTable
            zones={zones}
            onEdit={(zone) => {
              setSelectedZone(zone);
              setShowZoneForm(true);
            }}
            onDelete={handleDeleteZone}
          />
        </TabsContent>

        <TabsContent value="rates">
          <ShippingRatesTable
            rates={rates}
            onEdit={(rate: ShippingRate) => {
              setSelectedRate(rate);
              setShowRateForm(true);
            }}
            onDelete={handleDeleteRate}
          />
        </TabsContent>
      </Tabs>

      {showZoneForm && (
        <ShippingZoneForm
          zone={selectedZone}
          onSubmit={handleZoneSubmit}
          onCancel={() => setShowZoneForm(false)}
        />
      )}

      {showRateForm && (
        <ShippingRateForm
          rate={selectedRate}
          zones={zones}
          onSubmit={handleRateSubmit}
          onCancel={() => setShowRateForm(false)}
        />
      )}
    </div>
  );
} 