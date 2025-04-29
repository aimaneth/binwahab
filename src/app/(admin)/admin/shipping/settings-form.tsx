"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ShippingSettingsFormProps {
  onSettingsUpdated?: () => void;
}

export function ShippingSettingsForm({ onSettingsUpdated }: ShippingSettingsFormProps) {
  const [isFreeShippingEnabled, setIsFreeShippingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch shipping settings
  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/shipping/settings");
        if (!response.ok) throw new Error("Failed to fetch shipping settings");
        
        const data = await response.json();
        setIsFreeShippingEnabled(data.freeShippingEnabled);
      } catch (error) {
        console.error("Error fetching shipping settings:", error);
        toast.error("Failed to load shipping settings");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Save settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/shipping/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          freeShippingEnabled: isFreeShippingEnabled
        })
      });

      if (!response.ok) throw new Error("Failed to save settings");
      
      toast.success("Shipping settings updated successfully");
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (error) {
      console.error("Error saving shipping settings:", error);
      toast.error("Failed to save shipping settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Global Shipping Settings</CardTitle>
        <CardDescription>Configure global shipping options for your store</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="free-shipping">Free Shipping</Label>
                <p className="text-sm text-muted-foreground">
                  Disable all shipping costs across the store
                </p>
              </div>
              <Switch
                id="free-shipping"
                checked={isFreeShippingEnabled}
                onCheckedChange={setIsFreeShippingEnabled}
              />
            </div>

            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 