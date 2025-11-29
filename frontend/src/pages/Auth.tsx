import { SignIn } from '@clerk/clerk-react';

export default function Auth() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-green-700">AgroGig</h1>
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: 'mx-auto',
                            card: 'shadow-none'
                        }
                    }}
                    routing="virtual"
                    signUpUrl="/auth"
                />
            </div>
        </div>
    );
}
