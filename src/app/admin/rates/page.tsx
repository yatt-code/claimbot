"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is used for notifications

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
  const [rates, setRates] = useState<RateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<RateConfig | null>(null);
  const [newRateValue, setNewRateValue] = useState<number | string>('');

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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, rate: RateConfig) => {
    setNewRateValue(e.target.value);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">⚙️ Admin Rate Configuration</h1>
      {loading && <p>Loading rates...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                            onChange={(e) => handleInputChange(e, rate)}
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
          </div>
        </div>
      )}
    </div>
  );
}