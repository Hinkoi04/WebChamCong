import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { attendanceService } from '../services/attendanceService';
import { Camera, ScanFace, Keyboard, ArrowLeft, CheckCircle2, AlertCircle, FlipHorizontal } from 'lucide-react';

import { useToast } from '../../../contexts/ToastContext';

function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {}
}

function speakGreeting(name) {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Xin chào ${name || 'bạn'}, điểm danh thành công`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {}
}

export default function CheckpointPage() {
  const [staffId, setStaffId] = useState('');
  const [mode, setMode] = useState('face'); // 'face' or 'manual'
  const [isMirrored, setIsMirrored] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // orgId được thiết lập qua URL: /checkpoint?orgId=1 (cấu hình trên thiết bị trạm)
  const orgId = searchParams.get('orgId');
  const { showToast } = useToast();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  // Dùng ref để tránh stale closure khi stopCamera() được gọi từ cleanup useEffect
  const streamRef = useRef(null);

  const stopCamera = React.useCallback(() => {
    // Dùng streamRef thay vì stream state để tránh stale closure
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const startCamera = React.useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'user' } 
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
      setError("Không thể truy cập Camera. Vui lòng kiểm tra quyền trình duyệt.");
      showToast("Lỗi truy cập Camera", "error");
    }
  }, [showToast]);

  // Initialize camera when in face mode
  useEffect(() => {
    if (mode === 'face') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = canvasRef.current;
    const maxWidth = 720;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const targetWidth = Math.round(video.videoWidth * scale);
    const targetHeight = Math.round(video.videoHeight * scale);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    // Convert to base64 jpeg
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!staffId) {
      setError("Vui lòng nhập mã nhân viên (Staff ID)");
      return;
    }
    if (!orgId) {
      setError("Trạm chưa được cấu hình. Vui lòng thêm ?orgId=xxx vào URL.");
      return;
    }

    setError('');
    setResult(null);
    setScanning(true);

    let checkInImage = "MANUAL_CHECKIN";

    if (mode === 'face') {
      const base64Img = captureImage();
      if (!base64Img) {
        setError("Lỗi camera. Không thể chụp ảnh khuôn mặt.");
        setScanning(false);
        return;
      }
      checkInImage = base64Img;
    }

    try {
      const data = await attendanceService.faceCheckIn(parseInt(staffId), checkInImage, parseInt(orgId));
      setResult(data);
      playSuccessBeep();
      speakGreeting(data.staffName);
      if (mode === 'face') {
        showToast("Nhận diện khuôn mặt thành công!", "success");
      } else {
        showToast("Chấm công thủ công thành công!", "success");
      }
      setStaffId('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || err.response?.data?.error || 'Không thể chấm công. Vui lòng thử lại';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleBackToDashboard = () => {
    const role = localStorage.getItem('role');
    if (role === 'USER') {
      navigate('/org/dashboard');
    } else {
      navigate('/login');
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'face' ? 'manual' : 'face');
    setResult(null);
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5" style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #18181b 0%, #09090b 100%)' }}>
      <div className="absolute top-6 left-6">
        <button 
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700"
        >
          <ArrowLeft className="w-5 h-5" /> Trở về
        </button>
      </div>

      <div className="w-full max-w-[900px] mx-auto text-center flex flex-col items-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading mb-3 bg-gradient-to-r from-violet-400 to-pink-500 bg-clip-text text-transparent">
          Trạm Chấm Công
        </h1>
        <p className="text-zinc-400 mb-8 text-sm sm:text-base max-w-xl">
          {mode === 'face' 
            ? 'Căn chỉnh khuôn mặt vào giữa camera và nhập ID nhân viên để xác thực' 
            : 'Nhập ID nhân viên để chấm công thủ công (bỏ qua xác minh khuôn mặt)'}
        </p>

        {/* Mode Toggle */}
        <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl mb-8 border border-zinc-800 backdrop-blur-xl">
          <button
            onClick={() => mode !== 'face' && toggleMode()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              mode === 'face' 
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <ScanFace className="w-4 h-4" /> Quét khuôn mặt
          </button>
          <button
            onClick={() => mode !== 'manual' && toggleMode()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              mode === 'manual' 
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Thủ công
          </button>
        </div>

        {/* Main Content Area */}
        <div className="w-full grid lg:grid-cols-2 gap-8 items-start">
          
          {/* Camera/Status Section */}
          <div className="w-full">
            <div className={`w-full aspect-video rounded-3xl border-2 overflow-hidden relative shadow-2xl transition-all duration-500 ${
              mode === 'face' ? 'border-violet-500/30 bg-black' : 'border-zinc-800 bg-zinc-900/50'
            }`}>
              
              {/* Camera Video */}
              {mode === 'face' && (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover will-change-transform transform-gpu ${
                      isMirrored ? '-scale-x-100' : ''
                    } ${!stream ? 'hidden' : ''}`}
                  />
                  {/* Mirror Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsMirrored(prev => !prev)}
                    title={isMirrored ? 'Đang bật lật ảnh gương (Selfie). Nhấn để tắt' : 'Đang tắt lật ảnh gương. Nhấn để bật'}
                    className="absolute top-3 right-3 z-10 p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer shadow-lg"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                  {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
                      <Camera className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">Đang mở camera...</p>
                    </div>
                  )}
                  {/* Face Guide Overlay */}
                  <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
                    <div className="w-full h-full border-2 border-dashed border-violet-500/50 rounded-full"></div>
                  </div>
                </>
              )}

              {/* Manual Mode Placeholder */}
              {mode === 'manual' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/50">
                  <Keyboard className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm">Chế độ chấm công thủ công</p>
                  <p className="text-xs mt-1 text-zinc-600">Không yêu cầu xác minh khuôn mặt</p>
                </div>
              )}

              {/* Scanning Overlay */}
              {scanning && (
                <div className="absolute inset-0 bg-violet-900/20 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                  <span className="mt-4 text-sm font-bold text-white tracking-widest uppercase">
                    {mode === 'face' ? 'Đang phân tích khuôn mặt...' : 'Đang xử lý...'}
                  </span>
                </div>
              )}
            </div>
            {/* Hidden canvas for capturing image */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Form Section */}
          <div className="w-full flex flex-col justify-center h-full gap-6">
            <form onSubmit={handleCheckIn} className="w-full p-6 sm:p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl shadow-xl backdrop-blur-md">
              <div className="mb-6">
                <label className="block text-left text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  ID Nhân Viên
                </label>
                <input
                  type="number"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="Ví dụ: 1"
                  className="w-full bg-black/50 border border-zinc-800 rounded-xl px-5 py-4 text-xl font-mono text-zinc-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-zinc-700"
                  disabled={scanning}
                />
              </div>

              <button
                type="submit"
                disabled={scanning || !staffId}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {scanning ? 'Đang xử lý...' : (mode === 'face' ? 'Chấm Công Khuôn Mặt' : 'Chấm Công Thủ Công')}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-left animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-400">Lỗi</h4>
                  <p className="text-sm text-red-400/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success Result */}
            {result && !error && (
              <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-left animate-in fade-in slide-in-from-bottom-2">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-emerald-400">Thành công!</h4>
                  <div className="flex items-center justify-between mt-1 text-sm text-zinc-300">
                    <span>Thời gian:</span>
                    <span className="font-mono font-bold text-white">{new Date(result.checkInTime).toLocaleTimeString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-sm text-zinc-300">
                    <span>Trạng thái:</span>
                    <span className="font-bold text-white">{result.status}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
