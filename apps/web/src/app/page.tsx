'use client';

import { useState } from 'react';
import { useSocket } from './providers';

export default function Home() {
  const { isConnected } = useSocket();
  const [apiResult, setApiResult] = useState<string | null>(null);

  const testApi = async () => {
    try {
      console.log('Testing API connection...');
      const response = await fetch('http://localhost:4000/api/test');
      const data = await response.json();
      console.log('API response:', data);
      setApiResult(JSON.stringify(data));
    } catch (error) {
      console.error('API test failed:', error);
      setApiResult(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>MRU ERP System</h1>

      <div style={{ marginTop: 20 }}>
        <h2>Socket.io Status</h2>
        <p>
          Connection status: {' '}
          <span style={{
            color: isConnected ? 'green' : 'red',
            fontWeight: 'bold'
          }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </p>
        <p>Check the browser console for detailed socket logs</p>
      </div>

      <div style={{ marginTop: 20 }}>
        <h2>API Connection Test</h2>
        <button
          onClick={testApi}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Test API Connection
        </button>

        {apiResult && (
          <pre style={{ marginTop: 10, padding: 10, backgroundColor: '-moz-initial', borderRadius: 4 }}>
            {apiResult}
          </pre>
        )}
      </div>
    </div>
  );
}
