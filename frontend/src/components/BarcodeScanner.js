'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { XMarkIcon, CameraIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

/**
 * BarcodeScanner Component
 * @param {Function} onScanSuccess - Callback when a barcode is successfully scanned
 * @param {Function} onClose - Callback to close the scanner
 */
export default function BarcodeScanner({ onScanSuccess, onClose }) {
  const [cameras, setCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [isStopping, setIsStopping] = useState(false);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Initialize the scanner
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCodeRef.current = html5QrCode;

    const initializeCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          
          // Try to find the back camera automatically
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('traseira') ||
            device.label.toLowerCase().includes('rear')
          );
          
          const targetId = backCamera ? backCamera.id : devices[0].id;
          setCurrentCameraId(targetId);
          await startScanner(targetId);
        }
      } catch (err) {
        console.error("Erro ao obter câmaras:", err);
      }
    };

    initializeCameras();

    // Cleanup on unmount
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId) => {
    if (!html5QrCodeRef.current) return;

    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.0
    };

    try {
      // If already scanning, stop first
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      await html5QrCodeRef.current.start(
        cameraId,
        config,
        (decodedText) => {
          if (navigator.vibrate) navigator.vibrate(200);
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Silent scan error
        }
      );
    } catch (err) {
      console.error("Erro ao iniciar o scanner:", err);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Erro ao parar o scanner:", err);
      }
    }
  };

  const switchCamera = async () => {
    if (cameras.length < 2 || isStopping) return;
    
    setIsStopping(true);
    const currentIndex = cameras.findIndex(c => c.id === currentCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;
    
    setCurrentCameraId(nextCameraId);
    await startScanner(nextCameraId);
    setIsStopping(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] bg-black animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-dark-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in border border-white/20 dark:border-dark-700/50 max-h-full flex flex-col">
        
        {/* Header */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-500">
              <CameraIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-dark-900 dark:text-white">Leitor de Código</h3>
              <p className="text-xs text-dark-400 dark:text-dark-300">Aponte para o código de barras</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cameras.length > 1 && (
              <button 
                onClick={switchCamera}
                disabled={isStopping}
                className="p-2 rounded-xl bg-dark-100 dark:bg-dark-800 text-dark-500 hover:scale-110 transition-transform disabled:opacity-50"
                title="Trocar Câmara"
              >
                <ArrowsRightLeftIcon className="h-5 w-5" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-dark-100 dark:bg-dark-800 text-dark-500 hover:scale-110 transition-transform"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scanner Body */}
        <div className="p-6 pt-4">
          <div 
            id="reader" 
            className="w-full aspect-square rounded-3xl overflow-hidden bg-dark-950 border-2 border-primary-500/30 relative"
          >
            {/* Visual overlay for scanning area */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-[250px] h-[150px] border-2 border-primary-500 rounded-xl relative shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                {/* Scanning line animation */}
                <div className="absolute left-0 right-0 top-0 h-0.5 bg-primary-500 shadow-[0_0_10px_#ff4d00] animate-scan-line" />
                
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary-500" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary-500" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary-500" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-8 pb-8 text-center space-y-2">
          <p className="text-sm font-medium text-dark-900 dark:text-white">
            {cameras.length > 1 ? 'Use o botão acima para trocar de câmara se necessário.' : 'Câmara traseira recomendada.'}
          </p>
          <p className="text-xs text-dark-500 dark:text-dark-300">
            A leitura será automática assim que o código estiver focado na área central.
          </p>
        </div>

        <style jsx>{`
          @keyframes scan-line {
            0% { top: 0% }
            100% { top: 100% }
          }
          .animate-scan-line {
            animation: scan-line 2s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
