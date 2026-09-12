import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Flashlight, Volume2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { soundFx } from '../../utils/sounds';

export default function CameraBarcodeScannerModal({ isOpen, onClose, onDetected }) {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [continuousMode, setContinuousMode] = useState(true);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const trackRef = useRef(null);
  const animFrameRef = useRef(null);
  const detectorRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    setIsScanning(true);
    setLastScanned(null);

    try {
      // Check for BarcodeDetector API
      if ('BarcodeDetector' in window) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats();
          detectorRef.current = new window.BarcodeDetector({
            formats: supported.length > 0 ? supported : ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e']
          });
        } catch {
          detectorRef.current = null;
        }
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      // Check if torch is supported
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        setHasTorch(true);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        startDetectionLoop();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please allow camera permissions in your browser or device settings.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (trackRef.current) {
      if (torchOn) {
        trackRef.current.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
      }
      trackRef.current.stop();
      trackRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!trackRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await trackRef.current.applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  const handleBarcodeDetected = (code) => {
    if (!code) return;
    const clean = String(code).trim();
    if (!clean) return;

    // Trigger haptic vibration for retail mobile feedback
    if ('vibrate' in navigator) {
      try { navigator.vibrate(80); } catch {}
    }

    // Audio beep
    soundFx.barcodeScan();

    setLastScanned(clean);
    if (onDetected) {
      onDetected(clean);
    }

    if (!continuousMode) {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const startDetectionLoop = () => {
    let lastDetectionTime = 0;

    const tick = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = Date.now();
      // Throttle detection to every 250ms for performance
      if (now - lastDetectionTime > 250 && detectorRef.current) {
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue && rawValue !== lastScanned) {
              lastDetectionTime = now;
              handleBarcodeDetected(rawValue);
            }
          }
        } catch (e) {
          // Frame dropped, continue
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  if (!isOpen) return null;

  return (
    <div className="pos-modal-overlay" style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div 
        className="glass-card" 
        style={{ 
          width: '100%', 
          maxWidth: '520px', 
          background: 'rgba(11, 17, 30, 0.95)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <Camera size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>Camera Barcode Scanner</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Point camera at product barcode or price tag</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder Window */}
        <div style={{ position: 'relative', width: '100%', height: '340px', background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {error ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#f87171' }}>
              <AlertCircle size={44} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px', margin: '0 0 16px' }}>{error}</p>
              <button 
                onClick={startCamera} 
                className="btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
              >
                <RefreshCw size={14} /> Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                autoPlay 
                muted 
                playsInline 
              />
              
              {/* Target Scan Box Overlay */}
              <div 
                style={{
                  position: 'absolute',
                  width: '260px',
                  height: '180px',
                  border: '2px solid rgba(59, 130, 246, 0.8)',
                  borderRadius: '16px',
                  boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                {/* Red Laser Sweep Animation Line */}
                <div 
                  style={{
                    width: '90%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #ef4444, #f87171, transparent)',
                    boxShadow: '0 0 10px #ef4444',
                    animation: 'scannerLaser 2s infinite ease-in-out'
                  }}
                />
              </div>

              {/* Controls bar inside video */}
              <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    style={{
                      background: torchOn ? '#eab308' : 'rgba(0,0,0,0.6)',
                      color: torchOn ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(8px)'
                    }}
                    title="Toggle Flashlight"
                  >
                    <Flashlight size={18} />
                  </button>
                )}
              </div>

              {/* Status pill overlay */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: lastScanned ? '#34d399' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backdropFilter: 'blur(8px)'
                }}
              >
                {lastScanned ? (
                  <>
                    <CheckCircle2 size={14} color="#10b981" />
                    <span>Scanned: <strong>{lastScanned}</strong></span>
                  </>
                ) : (
                  <span>Align barcode inside frame</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Settings & Actions */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'rgba(15, 23, 42, 0.6)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1' }}>
            <input 
              type="checkbox" 
              checked={continuousMode} 
              onChange={(e) => setContinuousMode(e.target.checked)} 
              style={{ accentColor: '#3b82f6', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            Continuous Multi-Scan
          </label>

          <button 
            onClick={onClose} 
            className="btn-secondary" 
            style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '10px' }}
          >
            Done
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scannerLaser {
          0% { transform: translateY(-70px); opacity: 0.6; }
          50% { transform: translateY(70px); opacity: 1; }
          100% { transform: translateY(-70px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
