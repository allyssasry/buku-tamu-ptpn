import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, X, AlertCircle } from 'lucide-react';

const CameraCapture = ({ label, required = false, value, onChange, placeholderText = "Ambil foto atau upload gambar" }) => {
  const [mode, setMode] = useState(value ? 'preview' : 'idle'); // 'idle' | 'camera' | 'preview'
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isStarting, setIsStarting] = useState(false);

  // Stop camera on unmount or mode switch
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  // Bind video stream whenever camera mode is active
  useEffect(() => {
    if (mode === 'camera' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn("Video play warning:", err);
      });
    }
  }, [mode, stream]);

  const startCamera = async () => {
    setCameraError(null);
    setIsStarting(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Akses kamera tidak didukung di lingkungan ini (pastikan web diakses via localhost atau HTTPS). Silakan gunakan tombol 'Upload Gambar'.");
      setIsStarting(false);
      return;
    }

    try {
      let mediaStream = null;
      // 1. Coba kamera depan/webcam (user)
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (errConstraint) {
        // 2. Fallback untuk webcam laptop/PC umum tanpa batasan facingMode
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);
      setMode('camera');
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Izin kamera ditolak oleh browser. Silakan klik ikon gembok / kamera di sebelah kiri alamat URL browser (address bar) dan pilih 'Allow / Izinkan', lalu coba lagi.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("Perangkat kamera / webcam tidak terdeteksi di komputer ini. Silakan gunakan opsi 'Upload Gambar'.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError("Kamera sedang digunakan oleh aplikasi lain (seperti Zoom, Google Meet, atau Camera App). Tutup aplikasi tersebut dan coba kembali.");
      } else {
        setCameraError("Kamera tidak dapat diakses (" + (err.message || err.name) + "). Anda dapat menggunakan tombol 'Upload Gambar'.");
      }
      setMode('idle');
    } finally {
      setIsStarting(false);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();
    setMode('preview');
    onChange(dataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMode('preview');
        onChange(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    onChange('');
    setMode('idle');
  };

  return (
    <div className="camera-capture-container" style={{ marginBottom: 16 }}>
      {label && (
        <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>
          {label} {required && <span className="required">*</span>}
        </label>
      )}

      {cameraError && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '12px 14px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          fontSize: '0.85rem',
          color: '#b91c1c',
          marginBottom: 12,
          lineHeight: 1.45
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Mode Idle: Choose Camera or Upload */}
      {mode === 'idle' && !value && (
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-md)',
          padding: '24px 16px',
          textAlign: 'center',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#047857'
          }}>
            <Camera size={22} />
          </div>
          <div style={{ fontSize: '0.875rem', color: '#475569' }}>
            {placeholderText}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={startCamera}
              disabled={isStarting}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: isStarting ? 0.7 : 1 }}
            >
              <Camera size={15} />
              <span>{isStarting ? 'Membuka Kamera...' : 'Gunakan Kamera'}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Upload size={15} />
              <span>Upload Gambar</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Mode Camera: Live Preview & Snap */}
      {mode === 'camera' && (
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: '#0f172a',
          border: '1px solid #cbd5e1',
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
          }}>
            <button
              type="button"
              onClick={takePhoto}
              className="btn btn-primary"
              style={{ padding: '8px 20px', borderRadius: 8 }}
            >
              <Camera size={16} />
              <span>Ambil Foto</span>
            </button>
            <button
              type="button"
              onClick={() => { stopCamera(); setMode('idle'); }}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: 8 }}
            >
              <X size={15} />
              <span>Batal</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode Preview: Show Captured Image with Retake */}
      {(mode === 'preview' || (value && mode !== 'camera')) && (
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          background: '#f8fafc',
        }}>
          <img
            src={value}
            alt="Captured Preview"
            style={{ width: '100%', maxHeight: 280, objectFit: 'contain', display: 'block', background: '#f8fafc' }}
          />
          <div style={{
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontSize: '0.8125rem', fontWeight: 600 }}>
              <CheckCircle size={16} />
              <span>Foto Berhasil Diambil</span>
            </div>
            <button
              type="button"
              onClick={handleRetake}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} />
              <span>Ambil Ulang</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
