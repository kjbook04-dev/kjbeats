'use client';

import { useEffect, useState } from 'react';
import { User } from '../context/UserContext';

interface StoredUser extends User {
  password: string;
}

export default function DebugPage() {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('kjbeats_users') || '[]');
    const storedCurrentUser = JSON.parse(localStorage.getItem('kjbeats_user') || 'null');
    setUsers(storedUsers);
    setCurrentUser(storedCurrentUser);
  }, []);

  const clearAllData = () => {
    localStorage.removeItem('kjbeats_users');
    localStorage.removeItem('kjbeats_user');
    setUsers([]);
    setCurrentUser(null);
    alert('All data cleared!');
  };

  const testLogin = (username: string, password: string) => {
    const foundUser = users.find((u: StoredUser) => 
      u.username === username && u.password === password
    );
    if (foundUser) {
      alert(`User found! Username: ${foundUser.username}, FirstName: ${foundUser.firstName || 'MISSING'}`);
    } else {
      alert('User not found with those credentials');
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Debug User Data</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">All Users in localStorage:</h2>
        <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(users, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Current User Session:</h2>
        <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(currentUser, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Test Login:</h2>
        <div className="space-y-4">
          {users.map((user, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg">
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>FirstName:</strong> {user.firstName || 'MISSING'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <button 
                onClick={() => testLogin(user.username, user.password)}
                className="mt-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
              >
                Test Login for {user.username}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-x-4">
        <button 
          onClick={clearAllData}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
        >
          Clear All Data
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}