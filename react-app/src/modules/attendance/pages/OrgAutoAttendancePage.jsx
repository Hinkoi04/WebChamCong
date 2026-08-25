import React, { useState, useEffect, useRef, useCallback } from 'react';
import { attendanceService } from '../services/attendanceService';
import { staffService } from '../../staff/services/staffService';
import { 
  Camera, CameraOff, ScanFace, Keyboard, CheckCircle2, 
  Sparkles, UserCheck, RefreshCw, LogIn, LogOut, Clock, AlertTriangle, ShieldCheck,
  Power
} from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {}
}

function speakGreeting(name, isCheckOut = false) {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = isCheckOut
        ? `Tạm biệt ${name}, chúc bạn một buổi tối vui vẻ`
        : `Xin chào ${name}, chúc bạn một ngày làm việc hiệu quả`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {}
}

export default function OrgAutoAttendancePage() {
  // Action Type: 'CHECK_IN' or 'CHECK_OUT'
  const [actionType, setActionType] = useState('CHECK_IN');
  // Sub-mode: 'face' (Camera AI) or 'manual' (Thủ công)
  const [mode, setMode] = useState('face');
  // Camera Power Switch
  const [isCameraActive, setIsCameraActive] = useState(true);
  
  const [staffId, setStaffId] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('Đang sẵn sàng quét khuôn mặt...');
  const [cooldown, setCooldown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { showToast } = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const orgId = localStorage.getItem('orgId');

  // Cập nhật đồng hồ thời gian thực
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tải danh sách nhân sự
  useEffect(() => {
    if (orgId) {
      staffService.getStaffList(orgId).then(setStaffList).catch(console.error);
    }
  }, [orgId]);

  // Dừng camera và dọn dẹp interval triệt để
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.error(e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
              track.enabled = false;
            } catch (e) {}
          });
        }
        videoRef.current.srcObject = null;
      }
    }
    setStream(null);
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    isProcessingRef.current = false;
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  // Quét tự động khuôn mặt qua AI Kiosk Endpoint với actionType tương ứng
  const performAutoScan = useCallback(async () => {
    if (isProcessingRef.current || !orgId || mode !== 'face') return;

    const base64Img = captureImage();
    if (!base64Img) return;

    isProcessingRef.current = true;
    setScanning(true);
    setStatusMessage('AI đang phân tích khuôn mặt...');

    try {
      const data = await attendanceService.faceScan(base64Img, parseInt(orgId), actionType);
      setResult({ ...data, isCheckOut: actionType === 'CHECK_OUT' });
      setError('');
      
      const staffName = data.staffName || `Nhân viên #${data.staffId}`;
      const actionText = actionType === 'CHECK_OUT' ? 'TAN CA (Check-out)' : 'VÀO CA (Check-in)';

      // Phát âm thanh Chime & Giọng đọc AI chúc mừng
      playSuccessBeep();
      speakGreeting(staffName, actionType === 'CHECK_OUT');

      showToast(`Điểm danh ${actionText} thành công: ${staffName}`, 'success');
      setStatusMessage(`Đã ghi nhận ${actionText}: ${staffName}`);

      // Kích hoạt thời gian chờ cooldown 3.5 giây trước khi quét người tiếp theo
      setCooldown(true);
      setTimeout(() => {
        setCooldown(false);
        setStatusMessage(`Sẵn sàng quét ${actionType === 'CHECK_OUT' ? 'Tan ca' : 'Vào ca'}...`);
        isProcessingRef.current = false;
        setScanning(false);
      }, 3500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.detail;
      if (errorMsg && (errorMsg.includes('đã Check-in') || errorMsg.includes('đã Check-out') || errorMsg.includes('chưa Check-in') || errorMsg.includes('hoàn thành'))) {
        setError(errorMsg);
        setStatusMessage(errorMsg);
        // Kích hoạt cooldown 3.5s để ngưng spam request khi đã có trạng thái điểm danh
        setCooldown(true);
        setTimeout(() => {
          setCooldown(false);
          setStatusMessage(`Sẵn sàng quét ${actionType === 'CHECK_OUT' ? 'Tan ca' : 'Vào ca'}...`);
          isProcessingRef.current = false;
          setScanning(false);
        }, 3500);
      } else {
        if (errorMsg && errorMsg.includes('Không nhận ra')) {
          setStatusMessage('Chưa phát hiện nhân viên hợp lệ trong hệ thống...');
        } else if (errorMsg) {
          setStatusMessage(errorMsg);
        }
        isProcessingRef.current = false;
        setScanning(false);
      }
    }
  }, [captureImage, orgId, mode, actionType, showToast]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Khởi động vòng lặp quét AI tự động mỗi 2.2 giây
      setTimeout(() => {
        if (scanTimerRef.current) clearInterval(scanTimerRef.current);
        scanTimerRef.current = setInterval(() => {
          performAutoScan();
        }, 2200);
      }, 1200);
    } catch (err) {
      console.error('Camera access denied or unavailable', err);
      setError('Không thể truy cập Camera. Vui lòng kiểm tra quyền trình duyệt.');
      showToast('Lỗi truy cập Camera', 'error');
    }
  }, [performAutoScan, showToast]);

  // Khởi tạo camera khi ở mode face và isCameraActive
  useEffect(() => {
    if (mode === 'face' && isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, isCameraActive, startCamera, stopCamera]);

  const toggleCamera = () => {
    setIsCameraActive((prev) => {
      const next = !prev;
      if (!next) {
        stopCamera();
      }
      showToast(next ? 'Đã bật Camera điểm danh' : 'Đã tắt Camera', next ? 'info' : 'warning');
      return next;
    });
  };

  // Chuyển tab Vào ca / Tan ca -> xóa kết quả cũ
  const handleTabChange = (type) => {
    setActionType(type);
    setResult(null);
    setError('');
    setStatusMessage(`Sẵn sàng quét ${type === 'CHECK_OUT' ? 'Tan ca' : 'Vào ca'}...`);
  };

  // Xử lý chấm công thủ công
  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    if (!staffId) {
      setError('Vui lòng chọn nhân viên');
      return;
    }

    setError('');
    setResult(null);
    setScanning(true);

    try {
      const data = await attendanceService.faceCheckIn(parseInt(staffId), 'MANUAL_CHECKIN', parseInt(orgId), actionType);
      setResult({ ...data, isCheckOut: actionType === 'CHECK_OUT' });
      const matchedStaff = staffList.find((s) => s.id === parseInt(staffId));
      const staffName = matchedStaff ? matchedStaff.fullName : `Nhân viên #${staffId}`;
      const actionText = actionType === 'CHECK_OUT' ? 'Check-out' : 'Check-in';
      showToast(`Chấm công thủ công (${actionText}) thành công cho ${staffName}!`, 'success');
      setStaffId('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || 'Không thể chấm công. Vui lòng thử lại';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setScanning(false);
    }
  };

  const isCheckInTab = actionType === 'CHECK_IN';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Live Clock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            Trạm chấm công Kiosk AI
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
              isCheckInTab 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {isCheckInTab ? 'Chế độ Vào Ca' : 'Chế độ Tan Ca'}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Chọn tab tương ứng khi đến hoặc về để hệ thống ghi nhận chính xác và tránh chấm lặp
          </p>
        </div>

        {/* Digital Clock */}
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-inner shrink-0">
          <Clock className="w-5 h-5 text-violet-400" />
          <div className="font-mono text-right">
            <div className="text-sm font-bold text-zinc-100">
              {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}
            </div>
            <div className="text-[10px] text-zinc-400">
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* 2 MAIN TABS: VÀO CA vs TAN CA */}
        <div className="grid grid-cols-2 p-2 bg-zinc-950/80 border-b border-zinc-800 gap-2">
          
          {/* Tab 1: VÀO CA (Check-in) */}
          <button
            type="button"
            onClick={() => handleTabChange('CHECK_IN')}
            className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all cursor-pointer ${
              isCheckInTab
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <LogIn className={`w-5 h-5 ${isCheckInTab ? 'text-white' : 'text-emerald-400'}`} />
            <span>VÀO CA (Check-in)</span>
            {isCheckInTab && (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-700/80 text-emerald-100 rounded-full uppercase tracking-wider font-semibold">
                Đang mở
              </span>
            )}
          </button>

          {/* Tab 2: TAN CA (Check-out) */}
          <button
            type="button"
            onClick={() => handleTabChange('CHECK_OUT')}
            className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all cursor-pointer ${
              !isCheckInTab
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <LogOut className={`w-5 h-5 ${!isCheckInTab ? 'text-white' : 'text-amber-400'}`} />
            <span>TAN CA (Check-out)</span>
            {!isCheckInTab && (
              <span className="text-[10px] px-2 py-0.5 bg-amber-700/80 text-amber-100 rounded-full uppercase tracking-wider font-semibold">
                Đang mở
              </span>
            )}
          </button>

        </div>

        {/* Tab Guidance Banner */}
        <div className={`flex items-center gap-3 px-6 py-3.5 border-b border-zinc-800/80 transition-colors ${
          isCheckInTab ? 'bg-emerald-500/10' : 'bg-amber-500/10'
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
            isCheckInTab ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            {isCheckInTab ? (
              <p className="text-zinc-200">
                Chế độ <strong className="text-emerald-400">VÀO CA (Check-in)</strong>: Dành cho nhân viên đến làm việc đầu ca. Nếu đã check-in rồi, hệ thống sẽ nhắc nhở và ngăn điểm danh trùng.
              </p>
            ) : (
              <p className="text-zinc-200">
                Chế độ <strong className="text-amber-400">TAN CA (Check-out)</strong>: Dành cho nhân viên ra về/kết thúc ca. Chỉ ghi nhận cho nhân viên đã hoàn thành check-in trong ngày.
              </p>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          
          {/* Sub-mode & Camera Switch Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 gap-1">
              <button
                onClick={() => setMode('face')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                  mode === 'face'
                    ? isCheckInTab
                      ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-amber-600/90 text-white shadow-md shadow-amber-500/20'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <ScanFace className="w-4 h-4" /> Quét khuôn mặt AI
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                  mode === 'manual'
                    ? isCheckInTab
                      ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-amber-600/90 text-white shadow-md shadow-amber-500/20'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Keyboard className="w-4 h-4" /> Chấm công thủ công
              </button>
            </div>

            {/* Camera Power Switch Button */}
            {mode === 'face' && (
              <button
                type="button"
                onClick={toggleCamera}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-md ${
                  isCameraActive
                    ? isCheckInTab
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? (isCheckInTab ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse') : 'bg-zinc-600'}`} />
                {isCameraActive ? (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Camera: Đang BẬT</span>
                  </>
                ) : (
                  <>
                    <CameraOff className="w-4 h-4 text-red-400" />
                    <span className="text-zinc-300">Camera: Đang TẮT</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Viewport (Camera or Manual Icon) */}
            <div className="lg:col-span-7 w-full">
              <div className={`w-full aspect-4/3 sm:aspect-video rounded-3xl border-2 bg-black overflow-hidden relative shadow-2xl flex items-center justify-center transition-colors ${
                isCheckInTab ? 'border-emerald-500/40' : 'border-amber-500/40'
              }`}>
                {mode === 'face' ? (
                  isCameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          cooldown ? 'opacity-30' : 'opacity-100'
                        }`}
                      />

                      {/* Biometric Scanning Oval Overlay */}
                      {!cooldown && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className={`relative w-48 h-60 sm:w-56 sm:h-72 rounded-[45%] border-2 border-dashed transition-all duration-300 ${
                            scanning
                              ? isCheckInTab
                                ? 'border-emerald-400 scale-105 shadow-[0_0_30px_rgba(16,185,129,0.6)]'
                                : 'border-amber-400 scale-105 shadow-[0_0_30px_rgba(245,158,11,0.6)]'
                              : isCheckInTab
                              ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                              : 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                          }`}>
                            {/* Laser scanning line */}
                            <div className={`absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent animate-[scanLaser_2.4s_ease-in-out_infinite] ${
                              isCheckInTab ? 'text-emerald-400 shadow-[0_0_10px_#34d399]' : 'text-amber-400 shadow-[0_0_10px_#fbbf24]'
                            }`} />
                          </div>
                        </div>
                      )}

                      {/* Cooldown / Success Overlay */}
                      {cooldown && result && (
                        <div className={`absolute inset-0 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.3s_ease] ${
                          isCheckInTab ? 'bg-emerald-950/85 text-emerald-200' : 'bg-amber-950/85 text-amber-200'
                        }`}>
                          <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-3 shadow-lg ${
                            isCheckInTab 
                              ? 'bg-emerald-500/20 border-emerald-400 shadow-emerald-500/40 text-emerald-400' 
                              : 'bg-amber-500/20 border-amber-400 shadow-amber-500/40 text-amber-400'
                          }`}>
                            <CheckCircle2 className="w-10 h-10 animate-bounce" />
                          </div>
                          <h4 className="text-xl font-bold text-white">
                            {result.staffName || `Nhân viên #${result.staffId}`}
                          </h4>
                          <p className="text-sm font-semibold mt-1">
                            {isCheckInTab ? '✅ Đã Check-in thành công' : '🚪 Đã Check-out thành công'}
                          </p>
                          <p className="text-xs opacity-80 mt-1 font-mono">
                            Giờ ghi nhận: {new Date(result.checkOutTime || result.checkInTime).toLocaleTimeString('vi-VN')}
                          </p>
                        </div>
                      )}

                      {/* Camera opening state */}
                      {!stream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 bg-zinc-950">
                          <Camera className="w-12 h-12 mb-3 opacity-20 animate-pulse" />
                          <p className="text-xs">Đang mở camera và kích hoạt AI RetinaFace...</p>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Camera Turned OFF Standby Screen */
                    <div className="flex flex-col items-center justify-center text-zinc-500 p-8 text-center bg-zinc-950/90 w-full h-full">
                      <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-600 shadow-inner">
                        <CameraOff className="w-8 h-8 text-zinc-500" />
                      </div>
                      <h4 className="text-base font-bold text-zinc-200">Camera đang tạm dừng</h4>
                      <p className="text-xs mt-1.5 text-zinc-400 max-w-xs leading-relaxed">
                        Camera và tiến trình quét AI đã được tắt để tiết kiệm tài nguyên.
                      </p>
                      <button
                        type="button"
                        onClick={toggleCamera}
                        className={`mt-5 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer text-white flex items-center gap-2 ${
                          isCheckInTab
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                            : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        Bật Camera điểm danh
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
                    <Keyboard className="w-16 h-16 mb-4 opacity-30 text-violet-400" />
                    <p className="text-sm font-semibold text-zinc-200">Chế độ chấm công thủ công</p>
                    <p className="text-xs mt-1 text-zinc-500">Dành cho trường hợp nhân viên quên đăng ký khuôn mặt</p>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />

              {/* Status Message pill under camera */}
              {mode === 'face' && isCameraActive && (
                <div className="mt-4 flex items-center gap-2.5 px-4 py-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
                  {scanning ? (
                    <RefreshCw className={`w-4 h-4 animate-spin shrink-0 ${isCheckInTab ? 'text-emerald-400' : 'text-amber-400'}`} />
                  ) : (
                    <Sparkles className={`w-4 h-4 shrink-0 animate-pulse ${isCheckInTab ? 'text-emerald-400' : 'text-amber-400'}`} />
                  )}
                  <p className="text-xs font-medium text-zinc-300 truncate">{statusMessage}</p>
                </div>
              )}
            </div>

            {/* Right Information & Form Panel */}
            <div className="lg:col-span-5 w-full flex flex-col gap-5">
              {mode === 'manual' ? (
                <form onSubmit={handleManualCheckIn} className="w-full p-6 bg-zinc-950/60 border border-zinc-800 rounded-3xl space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Chọn nhân viên {isCheckInTab ? 'Vào ca' : 'Tan ca'}
                    </label>
                    <select
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                      disabled={scanning}
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.staffCode} - {s.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={scanning || !staffId}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50 text-white flex items-center justify-center gap-2 cursor-pointer ${
                      isCheckInTab
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                        : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                    }`}
                  >
                    {scanning ? 'Đang xử lý...' : `XÁC NHẬN ${isCheckInTab ? 'CHECK-IN' : 'CHECK-OUT'} THỦ CÔNG`}
                  </button>
                </form>
              ) : (
                <div className="w-full p-6 bg-zinc-950/60 border border-zinc-800 rounded-3xl space-y-4">
                  <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                    <UserCheck className={`w-4 h-4 ${isCheckInTab ? 'text-emerald-400' : 'text-amber-400'}`} />
                    Trạng thái Kiosk AI
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Camera đang tự động quét liên tục cho chế độ <strong className={isCheckInTab ? 'text-emerald-300' : 'text-amber-300'}>{isCheckInTab ? 'VÀO CA' : 'TAN CA'}</strong>. Nhân viên chỉ cần đứng trước màn hình 1-2 giây.
                  </p>
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                    <span>Tổng nhân sự: <strong className="text-zinc-300">{staffList.length}</strong></span>
                    <span>AI Detector: <strong className="text-emerald-400">RetinaFace</strong></span>
                  </div>
                </div>
              )}

              {/* Warning / Error Notification Box */}
              {error && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">Thông báo từ hệ thống</h4>
                    <p className="text-xs text-amber-200/90 mt-0.5 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Result Box */}
              {result && !error && (
                <div className={`p-5 rounded-2xl border space-y-3 animate-in fade-in ${
                  isCheckInTab 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCheckInTab ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {result.staffName || `Nhân viên #${result.staffId}`}
                      </h4>
                      <p className="text-xs opacity-80 font-mono">Mã: {result.staffCode || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-current/20">
                    <div>
                      <span className="opacity-75">Giờ vào: </span>
                      <strong className="text-white font-mono">
                        {result.checkInTime ? new Date(result.checkInTime).toLocaleTimeString('vi-VN') : '—'}
                      </strong>
                    </div>
                    <div>
                      <span className="opacity-75">Giờ ra: </span>
                      <strong className="text-white font-mono">
                        {result.checkOutTime ? new Date(result.checkOutTime).toLocaleTimeString('vi-VN') : '—'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLaser {
          0% { top: 10%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
