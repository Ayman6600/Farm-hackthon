import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Mic, AlertCircle } from 'lucide-react';
import { apiCallJson } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Farm {
    id: string;
    name: string;
    fields: Field[];
}

interface Field {
    id: string;
    name: string;
    crops: Crop[];
}

interface Crop {
    id: string;
    name: string;
}

export default function ActionLog() {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [actionType, setActionType] = useState('irrigation');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('liters');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [voiceText, setVoiceText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [farms, setFarms] = useState<Farm[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<string>('');
    const [selectedFieldId, setSelectedFieldId] = useState<string>('');
    const [selectedCropId, setSelectedCropId] = useState<string>('');
    const [loadingFarms, setLoadingFarms] = useState(true);
    const [error, setError] = useState<string>('');
    const [voiceError, setVoiceError] = useState<string>('');
    const recognitionRef = useRef<any>(null);

    const fetchFarms = useCallback(async () => {
        try {
            setLoadingFarms(true);
            setError('');
            const token = await getToken();
            if (!token) {
                setError('Authentication required. Please sign in.');
                setLoadingFarms(false);
                return;
            }

            const data = await apiCallJson<{ farms: Farm[], profile?: any }>('/api/profile', token);
            console.log('Fetched profile data:', data); // Debug log
            
            const farmsList = data.farms || [];
            console.log('Farms list:', farmsList); // Debug log
            
            setFarms(farmsList);
            
            if (farmsList.length > 0) {
                setSelectedFarmId(farmsList[0].id);
                if (farmsList[0].fields && farmsList[0].fields.length > 0) {
                    setSelectedFieldId(farmsList[0].fields[0].id);
                    if (farmsList[0].fields[0].crops && farmsList[0].fields[0].crops.length > 0) {
                        setSelectedCropId(farmsList[0].fields[0].crops[0].id);
                    }
                }
            }
        } catch (error: any) {
            console.error('Error fetching farms:', error);
            setError(error.message || 'Failed to load farms. Please try again.');
        } finally {
            setLoadingFarms(false);
        }
    }, [getToken]);

    const handleCreateFarm = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const token = await getToken();
            if (!token) {
                setError('Authentication required. Please sign in.');
                setLoading(false);
                return;
            }

            const farmName = prompt('Enter farm name:');
            if (!farmName || !farmName.trim()) {
                setLoading(false);
                return;
            }

            const newFarm = await apiCallJson<{ id: string; name: string }>('/api/farms', token, {
                method: 'POST',
                body: {
                    name: farmName.trim(),
                    location_text: '',
                    primary_crops: []
                }
            });

            console.log('Created farm:', newFarm);

            // Refresh farms list
            await fetchFarms();
            
            // Select the newly created farm
            if (newFarm?.id) {
                setSelectedFarmId(newFarm.id);
            }
        } catch (error: any) {
            console.error('Error creating farm:', error);
            setError(error.message || 'Failed to create farm. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [getToken, fetchFarms]);

    useEffect(() => {
        fetchFarms();
    }, [fetchFarms]);

    // Cleanup voice recognition on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const selectedFarm = farms.find(f => f.id === selectedFarmId);
    const selectedField = selectedFarm?.fields?.find(f => f.id === selectedFieldId);
    const availableCrops = selectedField?.crops || [];

    const handleFarmChange = useCallback((farmId: string) => {
        setSelectedFarmId(farmId);
        const farm = farms.find(f => f.id === farmId);
        if (farm?.fields && farm.fields.length > 0) {
            setSelectedFieldId(farm.fields[0].id);
            if (farm.fields[0].crops && farm.fields[0].crops.length > 0) {
                setSelectedCropId(farm.fields[0].crops[0].id);
            } else {
                setSelectedCropId('');
            }
        } else {
            setSelectedFieldId('');
            setSelectedCropId('');
        }
    }, [farms]);

    const handleFieldChange = useCallback((fieldId: string) => {
        setSelectedFieldId(fieldId);
        const field = selectedFarm?.fields?.find(f => f.id === fieldId);
        if (field?.crops && field.crops.length > 0) {
            setSelectedCropId(field.crops[0].id);
        } else {
            setSelectedCropId('');
        }
    }, [selectedFarm]);

    const handleVoiceInput = useCallback(() => {
        setVoiceError('');
        
        // Check for speech recognition support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setVoiceError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        // Stop any existing recognition
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setVoiceError('');
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                setIsListening(false);
                let errorMsg = 'Voice recognition error. ';
                switch (event.error) {
                    case 'no-speech':
                        errorMsg += 'No speech detected.';
                        break;
                    case 'audio-capture':
                        errorMsg += 'No microphone found.';
                        break;
                    case 'not-allowed':
                        errorMsg += 'Microphone permission denied.';
                        break;
                    default:
                        errorMsg += 'Please try again.';
                }
                setVoiceError(errorMsg);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setVoiceText(transcript);
                setNotes(prev => prev ? `${prev} ${transcript}` : transcript);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            setVoiceError('Failed to start voice recognition. Please try again.');
            console.error('Voice recognition error:', err);
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const token = await getToken();
            if (!token) {
                setError('Authentication required. Please sign in.');
                return;
            }

            if (!selectedFarmId) {
                setError('Please select a farm');
                setLoading(false);
                return;
            }

            const result = await apiCallJson('/api/actions', token, {
                method: 'POST',
                body: {
                    actionType,
                    farmId: selectedFarmId || null,
                    fieldId: selectedFieldId || null,
                    cropId: selectedCropId || null,
                    actionTimestamp: new Date().toISOString(),
                    quantity: quantity ? Number(quantity) : null,
                    unit,
                    notes,
                    voiceTranscript: voiceText
                }
            });

            alert(`Action Logged! Scores: Soil Health ${result.scores.soilHealth}, Weed Risk ${result.scores.weedRisk.score}`);
            navigate('/dashboard');
        } catch (error: any) {
            setError(error.message || 'Error logging action. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [selectedFarmId, selectedFieldId, selectedCropId, actionType, quantity, unit, notes, voiceText, getToken, navigate]);

    if (loadingFarms) {
        return <LoadingSpinner message="Loading farms..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Log Farm Action</h1>
                <button
                    type="button"
                    onClick={fetchFarms}
                    disabled={loadingFarms}
                    className="text-sm text-green-600 hover:text-green-700 font-medium disabled:text-gray-400 flex items-center"
                    title="Refresh farms list"
                >
                    🔄 Refresh
                </button>
            </div>
            
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-semibold">Error</p>
                        <p className="text-sm">{error}</p>
                        <button
                            type="button"
                            onClick={fetchFarms}
                            className="mt-2 text-xs underline hover:no-underline"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            )}

            {farms.length === 0 && !loadingFarms && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold mb-2">No Farms Found</p>
                    <p className="text-sm mb-3">You need to create a farm before logging actions.</p>
                    <button
                        type="button"
                        onClick={handleCreateFarm}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        {loading ? 'Creating...' : '+ Create Your First Farm'}
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Farm <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedFarmId}
                        onChange={(e) => handleFarmChange(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                        disabled={farms.length === 0 || loading}
                    >
                        <option value="">{farms.length === 0 ? 'No farms available - Create one below' : 'Select a farm'}</option>
                        {farms.map(farm => (
                            <option key={farm.id} value={farm.id}>{farm.name}</option>
                        ))}
                    </select>
                    {farms.length > 0 && (
                        <button
                            type="button"
                            onClick={handleCreateFarm}
                            disabled={loading}
                            className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium disabled:text-gray-400"
                        >
                            + Add Another Farm
                        </button>
                    )}
                </div>

                {selectedFarmId && selectedFarm && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Field (Optional)</label>
                        <select
                            value={selectedFieldId}
                            onChange={(e) => handleFieldChange(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="">Select a field (optional)</option>
                            {selectedFarm.fields && selectedFarm.fields.length > 0 ? (
                                selectedFarm.fields.map(field => (
                                    <option key={field.id} value={field.id}>{field.name}</option>
                                ))
                            ) : (
                                <option value="" disabled>No fields available</option>
                            )}
                        </select>
                    </div>
                )}

                {selectedFieldId && availableCrops.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Crop</label>
                        <select
                            value={selectedCropId}
                            onChange={(e) => setSelectedCropId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        >
                            <option value="">Select a crop (optional)</option>
                            {availableCrops.map(crop => (
                                <option key={crop.id} value={crop.id}>{crop.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Action Type</label>
                    <select
                        value={actionType}
                        onChange={(e) => setActionType(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    >
                        <option value="irrigation">Irrigation</option>
                        <option value="fertilization">Fertilization</option>
                        <option value="weeding">Weeding</option>
                        <option value="pesticide">Pesticide Spray</option>
                        <option value="scouting">Scouting</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Unit</label>
                        <input
                            type="text"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Voice Input</label>
                    <div className="flex gap-2">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-green-500 focus:border-green-500"
                            rows={3}
                            placeholder="Enter notes or use voice input..."
                        />
                        <button
                            type="button"
                            onClick={handleVoiceInput}
                            disabled={isListening}
                            className={`p-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'} text-white h-10 w-10 flex items-center justify-center transition-colors disabled:opacity-75`}
                            title={isListening ? 'Listening...' : 'Start voice input'}
                        >
                            <Mic size={20} />
                        </button>
                    </div>
                    {voiceText && (
                        <p className="text-xs text-gray-500 mt-1">
                            <span className="font-semibold">Transcript:</span> "{voiceText}"
                        </p>
                    )}
                    {voiceError && (
                        <p className="text-xs text-red-600 mt-1 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {voiceError}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        💡 Tip: Click the microphone button to use voice input (Chrome, Edge, or Safari recommended)
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading || !selectedFarmId || farms.length === 0}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Saving...' : 'Submit Action'}
                </button>
            </form>
        </div>
    );
}
