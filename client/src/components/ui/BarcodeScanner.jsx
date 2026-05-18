import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose }) {
  const [error, setError] = useState('');

  useEffect(() => {
    // Create instance
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: {width: 250, height: 150} },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      (errorMessage) => {
        // console.log(errorMessage); // Frequent logs
      }
    );

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-surface-100 bg-surface-50">
          <h3 className="font-semibold text-surface-900">Scan Barcode</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-200 text-surface-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 bg-black">
          <div id="reader" className="w-full text-white"></div>
        </div>
        <div className="p-4 bg-surface-50 text-xs text-surface-500 text-center">
          Point your camera at a barcode or QR code to scan.
        </div>
      </div>
    </div>
  );
}
