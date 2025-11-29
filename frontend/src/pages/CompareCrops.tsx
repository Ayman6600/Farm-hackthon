import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiCallJson } from '../lib/api';

export default function CompareCrops() {
    const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
    const [comparison, setComparison] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();

    const availableCrops = ['Tomato', 'Sorghum', 'Groundnut', 'Wheat', 'Rice'];

    const toggleCrop = (crop: string) => {
        if (selectedCrops.includes(crop)) {
            setSelectedCrops(selectedCrops.filter(c => c !== crop));
        } else {
            if (selectedCrops.length < 3) {
                setSelectedCrops([...selectedCrops, crop]);
            }
        }
    };

    const handleCompare = async () => {
        if (selectedCrops.length < 2) return;
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            const data = await apiCallJson<{ crops: any[] }>('/api/crops/compare', token, {
                method: 'POST',
                body: { crops: selectedCrops }
            });
            setComparison(data.crops);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-xl font-bold mb-4">Compare Crops</h1>

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="text-sm font-semibold mb-2">Select 2-3 crops:</h2>
                <div className="flex flex-wrap gap-2">
                    {availableCrops.map(crop => (
                        <button
                            key={crop}
                            onClick={() => toggleCrop(crop)}
                            className={`px-3 py-1 rounded-full text-sm border ${selectedCrops.includes(crop) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'
                                }`}
                        >
                            {crop}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleCompare}
                    disabled={selectedCrops.length < 2 || loading}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
                >
                    {loading ? 'Comparing...' : 'Compare Now'}
                </button>
            </div>

            {comparison.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg shadow">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                                {comparison.map(c => (
                                    <th key={c.name} className="p-3 text-left text-xs font-medium text-gray-500 uppercase">{c.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr>
                                <td className="p-3 text-sm font-medium text-gray-900">Profit</td>
                                {comparison.map(c => <td key={c.name} className="p-3 text-sm text-gray-700">{c.profitRange}</td>)}
                            </tr>
                            <tr>
                                <td className="p-3 text-sm font-medium text-gray-900">Risk</td>
                                {comparison.map(c => (
                                    <td key={c.name} className="p-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${c.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                                                c.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {c.riskLevel}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-3 text-sm font-medium text-gray-900">Water</td>
                                {comparison.map(c => <td key={c.name} className="p-3 text-sm text-gray-700 capitalize">{c.waterNeed}</td>)}
                            </tr>
                            <tr>
                                <td className="p-3 text-sm font-medium text-gray-900">Soil Suitability</td>
                                {comparison.map(c => <td key={c.name} className="p-3 text-sm text-gray-700">{c.soilSuitability}%</td>)}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
