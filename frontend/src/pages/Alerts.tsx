import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { AlertTriangle } from 'lucide-react';
import { apiCallJson } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Alerts() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();

    const fetchAlerts = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const data = await apiCallJson<any[]>('/api/alerts', token);
            setAlerts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    if (loading) return <LoadingSpinner message="Loading alerts..." />;

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-xl font-bold mb-4">Risk Alerts</h1>

            <div className="space-y-4">
                {alerts.length === 0 ? (
                    <p className="text-gray-500 text-center">No active alerts. Good job!</p>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert.id} className={`p-4 rounded-lg border shadow-sm ${alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                                alert.severity === 'medium' ? 'bg-orange-50 border-orange-200' :
                                    'bg-blue-50 border-blue-200'
                            }`}>
                            <div className="flex items-start">
                                <AlertTriangle className={`w-5 h-5 mr-3 mt-1 ${alert.severity === 'high' ? 'text-red-600' :
                                        alert.severity === 'medium' ? 'text-orange-600' :
                                            'text-blue-600'
                                    }`} />
                                <div>
                                    <h3 className="font-bold text-gray-800 capitalize">{alert.type.replace('_', ' ')}</h3>
                                    <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                                    {alert.suggested_action && (
                                        <div className="mt-2 text-sm bg-white bg-opacity-50 p-2 rounded">
                                            <span className="font-semibold">Action:</span> {alert.suggested_action}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
