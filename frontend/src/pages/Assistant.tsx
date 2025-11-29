import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Send } from 'lucide-react';
import { apiCallJson } from '../lib/api';

export default function Assistant() {
    const { getToken } = useAuth();
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!query.trim()) return;
        const userMsg = query;
        setMessages((prev) => [...prev, { text: userMsg, isUser: true }]);
        setQuery('');
        setLoading(true);

        try {
            const token = await getToken();
            if (!token) return;

            const data = await apiCallJson<{ answer: string }>('/api/assistant/query', token, {
                method: 'POST',
                body: { queryText: userMsg }
            });
            setMessages((prev) => [...prev, { text: data.answer, isUser: false }]);
        } catch (error) {
            setMessages((prev) => [...prev, { text: 'Sorry, I could not process that.', isUser: false }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white p-4 shadow">
                <h1 className="text-lg font-bold text-center">AgroGig Assistant</h1>
            </header>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 pb-20">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-3 rounded-lg ${msg.isUser ? 'bg-green-600 text-white' : 'bg-white shadow text-gray-800'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-center text-gray-500 text-sm">Thinking...</div>}
            </div>

            <div className="p-4 bg-white border-t fixed bottom-0 w-full flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about irrigation, weeds..."
                    className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-green-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="bg-green-600 text-white p-2 rounded-full">
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
}
