import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiCallJson } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Reports() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();

    const fetchReport = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const currentMonth = new Date().toISOString().slice(0, 7);
            const data = await apiCallJson(`/api/reports?month=${currentMonth}`, token);
            setReport(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    if (loading) return <LoadingSpinner message="Loading report..." />;

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-xl font-bold mb-4">Monthly Report (Nov 2025)</h1>

            {report && (
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="font-semibold text-gray-600">Summary</h2>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{report.summary_json.averageSoilHealth}</p>
                                <p className="text-xs text-gray-500">Avg Soil Health</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{report.summary_json.totalActions}</p>
                                <p className="text-xs text-gray-500">Total Actions</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                        <h3 className="font-bold text-yellow-800">Rewards Tier</h3>
                        <p className="text-3xl mt-2 uppercase tracking-wider font-extrabold text-yellow-600">{report.rewards_tier}</p>
                        <p className="text-xs text-yellow-700 mt-1">Keep improving scores to reach Gold!</p>
                    </div>

                    <button className="w-full bg-gray-800 text-white py-3 rounded-lg">
                        Download PDF Report
                    </button>
                </div>
            )}
        </div>
    );
}
