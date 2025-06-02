'use client';

import { useState, useEffect } from 'react';

export function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'slow' | 'disconnected'>('checking');
  const [connectionTime, setConnectionTime] = useState<number>(0);

  useEffect(() => {
    const checkConnection = async () => {
      const startTime = Date.now();
      
      try {
        const response = await fetch('/api/health');
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        setConnectionTime(duration);
        
        if (response.ok) {
          if (duration < 1000) {
            setStatus('connected');
          } else {
            setStatus('slow');
          }
        } else {
          setStatus('disconnected');
        }
      } catch (error) {
        setStatus('disconnected');
      }
    };

    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    switch (status) {
      case 'checking':
        return { 
          color: 'bg-yellow-500', 
          text: 'Checking connection...', 
          icon: '🔄' 
        };
      case 'connected':
        return { 
          color: 'bg-green-500', 
          text: `Connected (${connectionTime}ms)`, 
          icon: '✅' 
        };
      case 'slow':
        return { 
          color: 'bg-orange-500', 
          text: `Slow connection (${connectionTime}ms)`, 
          icon: '⚠️' 
        };
      case 'disconnected':
        return { 
          color: 'bg-red-500', 
          text: 'Connection issues', 
          icon: '❌' 
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-3 flex items-center space-x-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${statusInfo.color}`}></div>
        <span className="text-gray-700">{statusInfo.icon} {statusInfo.text}</span>
        {status === 'slow' && (
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
} 