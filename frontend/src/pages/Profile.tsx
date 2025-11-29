import { UserButton, useUser } from '@clerk/clerk-react';

export default function Profile() {
    const { user } = useUser();

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-xl font-bold mb-6">Farmer Profile</h1>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex items-center mb-4">
                    <div className="mr-4">
                        <UserButton afterSignOutUrl="/auth" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{user?.fullName || user?.firstName || 'Farmer'}</h2>
                        <p className="text-gray-500">{user?.emailAddresses[0]?.emailAddress}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">User ID</span>
                        <span className="font-medium text-sm">{user?.id}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Account Created</span>
                        <span className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
