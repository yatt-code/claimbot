"use client";

import AdminLayout from "@/components/AdminLayout";
import { useRBAC } from "@/hooks/useRBAC";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface RateConfigCondition {
  dayType?: string;
  designation?: string;
}

interface RateConfig {
  _id: string;
  type: 'mileage' | 'overtime_multiplier';
  value?: number;
  multiplier?: number;
  condition?: RateConfigCondition;
  effectiveDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export default function AdminRateConfigurationPage() {
  const rbac = useRBAC();
  const [rates, setRates] = useState<RateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<RateConfig | null>(null);
  const [newRateValue, setNewRateValue] = useState<number | string>('');

  // Check if user has permission to configure rates
  const canConfigureRates = rbac.hasPermission('config:update');

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        console.log("Fetching rates from:", `${baseUrl}/api/config/rates`);
        
        const response = await fetch(`${baseUrl}/api/config/rates`);
        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`Failed to fetch rates: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data: RateConfig[] = await response.json();
        console.log("Received rates data:", data);
        
        if (!Array.isArray(data)) {
          throw new Error(`Expected an array of rates but got: ${typeof data}`);
        }
        
        setRates(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error("Error in fetchRates:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const handleEditClick = (rate: RateConfig) => {
    setEditingRate(rate);
    // Use value for mileage, multiplier for overtime_multiplier
    const valueToEdit = rate.type === 'mileage' ? rate.value : rate.multiplier;
    setNewRateValue(valueToEdit?.toString() || '');
  };

  const handleCancelEdit = () => {
    setEditingRate(null);
    setNewRateValue('');
  };

  const handleSaveRate = async (rateId: string) => {
    if (editingRate === null) return;

    const loadingToast = toast.loading('Saving rate...');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/config/rates?id=${rateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rate: parseFloat(newRateValue as string) }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to save rate.');
      }

      const updatedRate: RateConfig = await response.json();
      setRates(rates.map(r => r._id === updatedRate._id ? updatedRate : r));
      toast.success('Rate saved successfully!', { id: loadingToast });
      handleCancelEdit(); // Exit editing mode
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Failed to save rate: ${errorMessage}`, { id: loadingToast });
      console.error("Error saving rate:", err);
    }
  };

  // Function to display the rate value based on type
  const getRateDisplay = (rate: RateConfig) => {
    if (rate.type === 'mileage') {
      return `$${rate.value?.toFixed(2) || '0.00'} per mile`;
    } else if (rate.type === 'overtime_multiplier') {
      const dayType = rate.condition?.dayType || 'unknown';
      return `${rate.multiplier || '0.00'}x (${dayType.charAt(0).toUpperCase() + dayType.slice(1)})`;
    }
    return 'N/A';
  };

  // Function to get the current value for editing
  const getEditValue = (rate: RateConfig) => {
    if (editingRate?._id === rate._id) {
      return newRateValue;
    }
    return rate.type === 'mileage' ? rate.value : rate.multiplier;
  };

  // Function to handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewRateValue(e.target.value);
  };

  // If user doesn't have permission to configure rates, show access denied
  if (!canConfigureRates) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don&apos;t have permission to configure system rates.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Rate Configuration</h1>
          <p className="text-gray-600 mt-1">
            Configure system rates for mileage and overtime calculations.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading rate configurations...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {/* Rates Configuration */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Current Rates</h2>
              <div className="space-y-4">
                {rates.map(rate => (
                  <div key={rate._id} className="border rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                      <div>
                        <span className="font-medium capitalize text-gray-800">
                          {rate.type.replace('_', ' ')}
                        </span>
                        {rate.condition?.dayType && (
                          <span className="ml-2 text-sm text-gray-600">
                            ({rate.condition.dayType})
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-gray-700">
                        {getRateDisplay(rate)}
                      </div>
                    </div>
                    <div className="p-4">
                      {editingRate?._id === rate._id ? (
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {rate.type === 'mileage' ? 'Rate per mile ($)' : 'Multiplier'}
                            </label>
                            <input
                              type="number"
                              value={getEditValue(rate)}
                              onChange={handleInputChange}
                              className="border rounded px-3 py-2 w-full max-w-xs"
                              step={rate.type === 'mileage' ? '0.01' : '0.1'}
                              min="0"
                            />
                          </div>
                          <div className="flex space-x-2 mt-6">
                            <button
                              onClick={() => handleSaveRate(rate._id)}
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleEditClick(rate)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {rates.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">⚙️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No rates configured</h3>
                  <p className="text-gray-500">System rates will need to be configured.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}