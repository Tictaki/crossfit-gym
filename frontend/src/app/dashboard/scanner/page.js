'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import BarcodeScanner from '@/components/BarcodeScanner';
import { WifiIcon, LinkIcon } from '@heroicons/react/24/outline';

export default function RemoteScannerPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    // Use current origin but port 3001 for backend
    const socketInstance = io(window.location.protocol + '//' + window.location.hostname + ':3001');
    
    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('join-scanner-room', roomId);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [roomId]);

  const handleScan = (code) => {
    if (socket && isConnected) {
      socket.emit('barcode-scanned', { roomId, code });
      setIsScanning(false);
    }
  };

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-dark-950 text-white">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-5xl font-black">!</div>
          <h1 className="text-2xl font-bold">QR Code Inválido</h1>
          <p className="text-dark-400">Por favor, faça o scan do código gerado no dashboard do computador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full bg-dark-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Header Stat */}
      <div className="fixed top-0 left-0 right-0 px-6 pt-[env(safe-area-inset-top,2rem)] flex justify-between items-center z-50">
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
          <span className="text-xs font-bold uppercase tracking-widest">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        <div className="bg-primary-500/20 px-4 py-2 rounded-2xl border border-primary-500/30">
          <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">
            Sala: {roomId.split('-')[0]}
          </span>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-8 animate-fade-in text-center">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary-500 blur-3xl opacity-20" />
          <div className="relative p-6 rounded-[2.5rem] bg-dark-900 border border-white/10 shadow-2xl">
            <WifiIcon className="h-16 w-16 text-primary-500 mx-auto" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight underline-glow">Leitor Remoto</h1>
          <p className="text-dark-400 font-medium">Use a câmara do telemóvel para enviar códigos de barras para o computador.</p>
        </div>

        <button
          onClick={() => setIsScanning(true)}
          disabled={!isConnected}
          className={`w-full py-5 rounded-3xl font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3
            ${isConnected 
              ? 'bg-gradient-primary text-white shadow-primary-500/20 hover:shadow-glow' 
              : 'bg-dark-800 text-dark-500 border border-white/5 cursor-not-allowed'}`}
        >
          <LinkIcon className="h-6 w-6" />
          {isConnected ? 'Iniciar Scan' : 'Aguardando Ligação...'}
        </button>
      </div>

      {isScanning && (
        <BarcodeScanner 
          onScanSuccess={handleScan} 
          onClose={() => setIsScanning(false)} 
        />
      )}
      
      <p className="fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom,2rem)] text-[10px] text-dark-500 uppercase tracking-[0.3em] font-bold text-center">
        CrossFit Gym • Remote Scanner System
      </p>
    </div>
  );
}
