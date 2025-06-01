import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is used for notifications

interface RateConfig {
  _id: string;
  type: string; // e.g., 'overtime'
  rate: number;
  // Add other fields as needed
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
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/config/rates`);

        if (!response.ok) {
          throw new Error(`Failed to fetch rates: ${response.statusText}`);
        }

        const data: RateConfig[] = await response.json();
        setRates(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error("Error fetching rates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const handleEditClick = (rate: RateConfig) => {
    setEditingRate(rate);
    setNewRateValue(rate.rate);
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
      const response = await fetch(`${baseUrl}/api/config/rates/${rateId}`, {
        method: 'PATCH', // Assuming PATCH for updating a specific rate
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rate: parseFloat(newRateValue as string) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save rate.');
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


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">⚙️ Admin Rate Configuration</h1>
      {loading && <p>Loading rates...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Current Rates</h2>
          <ul>
            {rates.map(rate => (
              <li key={rate._id} className="mb-2 p-4 border rounded shadow-sm flex justify-between items-center">
                <div>
                  <span className="font-medium">{rate.type}:</span> {rate.rate}
                </div>
                {editingRate?._id === rate._id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={newRateValue}
                      onChange={(e) => setNewRateValue(e.target.value)}
                      className="border rounded px-2 py-1 w-20"
                      step="0.01"
                    />
                    <button
                      onClick={() => handleSaveRate(rate._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditClick(rate)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}