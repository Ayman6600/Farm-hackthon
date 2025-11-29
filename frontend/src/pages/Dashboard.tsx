import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Cloud, Droplets, AlertTriangle, Sprout } from 'lucide-react';
import { apiCallJson } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Dashboard() {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();

    const fetchSummary = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const data = await apiCallJson('/api/dashboard/summary', token);
            setSummary(data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-green-600 text-white p-4">
                <h1 className="text-xl font-bold">AgroGig Dashboard</h1>
            </header>

            <main className="p-4 space-y-6">
                {/* Weather Card */}
                <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                    <div>
                        <h2 className="text-gray-500 text-sm">Today's Weather</h2>
                        <p className="text-2xl font-bold">{summary?.weather?.temp}°C</p>
                        <p className="text-sm text-gray-600">{summary?.weather?.condition}</p>
                    </div>
                    <Cloud className="text-blue-400 w-10 h-10" />
                </div>

                {/* Soil Mood Card */}
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-semibold">Soil Status</h2>
                        <Sprout className="text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-green-700">{summary?.soilMood?.label}</p>
                    <p className="text-xs text-gray-500">Based on recent data</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow text-center">
                        <p className="text-2xl font-bold text-green-600">{summary?.actionCount}</p>
                        <p className="text-xs text-gray-500">Actions Today</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow text-center">
                        <p className="text-2xl font-bold text-blue-600">{summary?.scores?.soilHealth}</p>
                        <p className="text-xs text-gray-500">Soil Health</p>
                    </div>
                </div>

                {/* Alerts Preview */}
                {summary?.alerts?.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h3 className="text-red-800 font-semibold mb-2 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" /> Alerts
                        </h3>
                        <ul className="space-y-2">
                            {summary.alerts.map((alert: any) => (
                                <li key={alert.id} className="text-sm text-red-700">
                                    {alert.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Log Action Button */}
                <Link to="/actions/log" className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-semibold shadow-lg hover:bg-green-700">
                    Log New Action
                </Link>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3">
                <Link to="/dashboard" className="text-green-600 flex flex-col items-center"><Sprout size={20} /><span className="text-xs">Home</span></Link>
                <Link to="/assistant" className="text-gray-500 flex flex-col items-center"><Cloud size={20} /><span className="text-xs">Assistant</span></Link>
                <Link to="/reports" className="text-gray-500 flex flex-col items-center"><Droplets size={20} /><span className="text-xs">Reports</span></Link>
                <Link to="/profile" className="text-gray-500 flex flex-col items-center"><div className="w-5 h-5 bg-gray-300 rounded-full"></div><span className="text-xs">Profile</span></Link>
            </nav>
        </div>
    );
}
