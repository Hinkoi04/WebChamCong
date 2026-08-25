import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, UploadCloud, Camera, Image as ImageIcon, Video, CheckCircle2, 
  Sparkles, RefreshCw, Check, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCcw
} from 'lucide-react';
import { staffService } from '../services/staffService';
import { useToast } from '../../../contexts/ToastContext';

const FACE_STEPS = [
  {
    id: 1,
    key: 'front',
    label: 'Chính diện',
    badge: '🟢 Góc 1/5',
    title: 'Nhìn thẳng chính diện',
    hint: 'Giữ khuôn mặt cân bằng và nhìn trực tiếp vào camera',
    direction: 'center',
    badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    ringStyle: 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]',
    laserStyle: 'from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399]',
  },
  {
    id: 2,
    key: 'left',
    label: 'Nghiêng trái',
    badge: '🔵 Góc 2/5',
    title: 'Nghiêng nhẹ sang trái',
    hint: 'Xoay đầu nhẹ sang phía bên trái (khoảng 15-20 độ)',
    direction: 'left',
    badgeStyle: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ringStyle: 'border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.4)]',
    laserStyle: 'from-transparent via-blue-400 to-transparent shadow-[0_0_8px_#60a5fa]',
  },
  {
    id: 3,
    key: 'right',
    label: 'Nghiêng phải',
    badge: '🟣 Góc 3/5',
    title: 'Nghiêng nhẹ sang phải',
    hint: 'Xoay đầu nhẹ sang phía bên phải (khoảng 15-20 độ)',
    direction: 'right',
    badgeStyle: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    ringStyle: 'border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.4)]',
    laserStyle: 'from-transparent via-purple-400 to-transparent shadow-[0_0_8px_#c084fc]',
  },
  {
    id: 4,
    key: 'up',
    label: 'Ngước lên',
    badge: '🟡 Góc 4/5',
    title: 'Ngước nhẹ lên trên',
    hint: 'Hơi nâng cằm hướng lên phía trên một chút',
    direction: 'up',
    badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    ringStyle: 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]',
    laserStyle: 'from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#fbbf24]',
  },
  {
    id: 5,
    key: 'down',
    label: 'Cúi xuống',
    badge: '🟠 Góc 5/5',
    title: 'Hơi cúi nhẹ xuống',
    hint: 'Hơi cúi cằm hướng xuống phía dưới một chút',
    direction: 'down',
    badgeStyle: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    ringStyle: 'border-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.4)]',
    laserStyle: 'from-transparent via-orange-400 to-transparent shadow-[0_0_8px_#fb923c]',
  },
];

export default function FaceModal({ isOpen, onClose, staff, onSuccess }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState('camera'); // 'camera' | 'upload'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [stream, setStream] = useState(null);

  // 5-Step Enrollment State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStepIndexRef = useRef(0); // Dùng Ref để tránh stale closure trong setInterval

  const [completedSteps, setCompletedSteps] = useState([false, false, false, false, false]);
  const [stepPreviews, setStepPreviews] = useState(['', '', '', '', '']);
  
  // AI Scanning States (State + Ref để hoàn toàn loại bỏ re-render loop)
  const [aiStatus, setAiStatus] = useState('idle'); // 'idle' | 'detecting' | 'processing' | 'step_success' | 'all_success' | 'error'
  const aiStatusRef = useRef('idle');
  const [statusMessage, setStatusMessage] = useState('Vui lòng nhìn thẳng vào camera');

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const isProcessingRef = useRef(false);
  const orgId = localStorage.getItem('orgId');

  const activeStep = FACE_STEPS[currentStepIndex] || FACE_STEPS[0];

  const updateAiStatus = useCallback((newStatus, message) => {
    aiStatusRef.current = newStatus;
    setAiStatus(newStatus);
    if (message) setStatusMessage(message);
  }, []);

  // Dừng camera và dọn dẹp interval
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    isProcessingRef.current = false;
  }, []);

  // Reset quy trình đăng ký 5 bước
  const resetEnrollment = useCallback(() => {
    currentStepIndexRef.current = 0;
    setCurrentStepIndex(0);
    setCompletedSteps([false, false, false, false, false]);
    setStepPreviews(['', '', '', '', '']);
    updateAiStatus('detecting', 'Đang khởi động quy trình đăng ký 5 góc...');
    isProcessingRef.current = false;
  }, [updateAiStatus]);

  // Chụp một frame từ video hiện tại
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const stepIdx = currentStepIndexRef.current;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const capturedFile = new File([blob], `staff_${staff?.id}_step${stepIdx + 1}.jpg`, { type: 'image/jpeg' });
        resolve(capturedFile);
      }, 'image/jpeg', 0.92);
    });
  }, [staff]);

  // Vòng lặp gửi frame tới AI để kiểm tra và tự động lưu góc hiện tại
  const runAiDetection = useCallback(async () => {
    if (!isOpen || isProcessingRef.current || !orgId || !staff || aiStatusRef.current === 'all_success' || aiStatusRef.current === 'step_success') return;

    const stepIdx = currentStepIndexRef.current;
    if (stepIdx >= FACE_STEPS.length) return;

    const currentStep = FACE_STEPS[stepIdx];
    const frameFile = await captureFrame();
    if (!frameFile) return;

    isProcessingRef.current = true;
    updateAiStatus('processing', `AI đang phân tích & lưu góc ${currentStep.id}/5: ${currentStep.label}...`);

    try {
      // Ở bước 1 (stepIdx === 0): replace = true (vô hiệu hoá các vector cũ)
      // Ở bước 2..5 (stepIdx > 0): replace = false (tích luỹ thêm vector góc mới)
      const isReplace = stepIdx === 0;
      await staffService.uploadFace(orgId, staff.id, frameFile, isReplace);

      // Đã lưu góc thành công!
      const frameUrl = URL.createObjectURL(frameFile);
      
      setCompletedSteps((prev) => {
        const updated = [...prev];
        updated[stepIdx] = true;
        return updated;
      });

      setStepPreviews((prev) => {
        const updated = [...prev];
        updated[stepIdx] = frameUrl;
        return updated;
      });

      if (stepIdx < FACE_STEPS.length - 1) {
        // Chuyển sang bước tiếp theo
        const nextIdx = stepIdx + 1;
        currentStepIndexRef.current = nextIdx;
        setCurrentStepIndex(nextIdx);
        
        updateAiStatus('step_success', `✅ Đã lưu ${currentStep.label}! Hãy ${FACE_STEPS[nextIdx].hint}...`);

        setTimeout(() => {
          updateAiStatus('detecting', `AI đang quét góc ${FACE_STEPS[nextIdx].id}/5: ${FACE_STEPS[nextIdx].title}...`);
          isProcessingRef.current = false;
        }, 1200);
      } else {
        // HOÀN TẤT ĐỦ 5 GÓC!
        updateAiStatus('all_success', '🎉 Đã hoàn tất đăng ký đủ 5 góc khuôn mặt!');
        stopCamera();
        showToast(`Đã tự động thu thập và đăng ký 5 góc khuôn mặt cho ${staff.fullName}`, 'success');

        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1800);
      }
    } catch (err) {
      const backendMsg = err.response?.data?.message || err.response?.data?.detail;
      let msg = `Đang căn chỉnh góc ${currentStep.label} với AI...`;
      if (backendMsg && backendMsg.includes('Không tìm thấy khuôn mặt')) {
        msg = `Chưa phát hiện góc ${currentStep.label}, vui lòng căn chỉnh theo hướng dẫn`;
      }
      updateAiStatus('detecting', msg);
      isProcessingRef.current = false;
    }
  }, [isOpen, orgId, staff, captureFrame, stopCamera, showToast, onSuccess, onClose, updateAiStatus]);

  const runAiDetectionRef = useRef(runAiDetection);
  useEffect(() => {
    runAiDetectionRef.current = runAiDetection;
  }, [runAiDetection]);

  // Khởi động Camera
  const startCamera = useCallback(async () => {
    setFile(null);
    setPreview('');
    resetEnrollment();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Đợi camera ổn định rồi bắt đầu quét AI tự động mỗi 2.2 giây
      setTimeout(() => {
        updateAiStatus('detecting', `AI đang tự động quét góc 1/5: Nhìn thẳng chính diện...`);
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = setInterval(() => {
          runAiDetectionRef.current();
        }, 2200);
      }, 1000);
    } catch (err) {
      alert('Không thể truy cập camera: ' + err.message);
      setMode('upload');
    }
  }, [resetEnrollment, updateAiStatus]);

  // Gán stream vào video tag khi stream thay đổi
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Mở camera tự động khi mở modal ở mode camera (chỉ phụ thuộc vào isOpen và mode)
  useEffect(() => {
    if (isOpen) {
      if (mode === 'camera') {
        startCamera();
      }
    } else {
      stopCamera();
      setFile(null);
      setPreview('');
      aiStatusRef.current = 'idle';
      setAiStatus('idle');
    }
  }, [isOpen, mode, startCamera, stopCamera]);

  // Tải ảnh thủ công (Upload mode)
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleManualUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !orgId || !staff) return;

    try {
      updateAiStatus('processing', 'Đang phân tích và tải ảnh lên...');
      showToast('Đang tải ảnh lên Cloudinary & AI...', 'info');
      await staffService.uploadFace(orgId, staff.id, file, true);
      showToast('Đã lưu khuôn mặt thành công!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      updateAiStatus('error');
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Lỗi khi tải ảnh khuôn mặt';
      showToast(msg, 'error');
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease_both]">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/15 text-violet-400 rounded-xl border border-violet-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Đăng ký 5 góc khuôn mặt AI
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Best-Match AI
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Nhân viên: <span className="font-semibold text-zinc-200">{staff.fullName}</span> ({staff.staffCode})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-950/30 p-1.5 gap-2">
          <button
            type="button"
            onClick={() => { setMode('camera'); }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
              mode === 'camera'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Video className="w-4 h-4" /> Quét 5 góc tự động (AI Scan)
          </button>
          <button
            type="button"
            onClick={() => { stopCamera(); setMode('upload'); }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
              mode === 'upload'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Tải ảnh thủ công
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {mode === 'camera' ? (
            <div className="flex flex-col items-center gap-3.5">

              {/* 5-Step Interactive Progress Bar */}
              <div className="w-full bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-3 shadow-inner">
                <div className="flex items-center justify-between gap-1 mb-2">
                  {FACE_STEPS.map((step, idx) => {
                    const isDone = completedSteps[idx];
                    const isCurrent = idx === currentStepIndex && aiStatus !== 'all_success';
                    return (
                      <div key={step.id} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          isDone
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                            : isCurrent
                            ? 'bg-violet-600 text-white ring-4 ring-violet-500/30 animate-pulse scale-110 shadow-lg shadow-violet-600/40'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
                        }`}>
                          {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                        </div>
                        <span className={`text-[10px] font-medium transition-colors ${
                          isDone ? 'text-emerald-400 font-semibold' : isCurrent ? 'text-violet-300 font-bold' : 'text-zinc-500'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar line */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-violet-500 to-indigo-500 transition-all duration-500"
                    style={{ 
                      width: `${aiStatus === 'all_success' ? 100 : (completedSteps.filter(Boolean).length / 5) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Current Step Instruction Banner */}
              {aiStatus !== 'all_success' && (
                <div className="w-full flex items-center justify-between px-3.5 py-2 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${activeStep.badgeStyle}`}>
                      {activeStep.badge}
                    </span>
                    <span className="text-xs font-bold text-zinc-100">{activeStep.title}</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 italic">{activeStep.hint}</span>
                </div>
              )}
              
              {/* Camera Scanner Viewport */}
              <div className="relative w-full aspect-4/3 sm:aspect-video rounded-2xl overflow-hidden bg-black border-2 border-zinc-800 shadow-2xl flex items-center justify-center">
                
                {/* Live Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    aiStatus === 'all_success' ? 'opacity-25' : 'opacity-100'
                  }`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* AI Target Biometric Oval Frame with Dynamic Directional Cue */}
                {aiStatus !== 'all_success' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`relative w-48 h-60 sm:w-56 sm:h-72 rounded-[45%] border-2 border-dashed transition-all duration-500 ${
                      aiStatus === 'processing' || aiStatus === 'step_success'
                        ? 'border-violet-400 scale-105 shadow-[0_0_35px_rgba(139,92,246,0.6)]'
                        : activeStep.ringStyle
                    }`}>
                      
                      {/* Laser scanning line */}
                      <div className={`absolute left-0 right-0 h-1 bg-gradient-to-r ${activeStep.laserStyle} animate-[scanLaser_2.0s_ease-in-out_infinite]`} />
                      
                      {/* Directional Cue Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center text-white/40">
                        {activeStep.direction === 'left' && (
                          <div className="flex items-center gap-1 text-blue-400 animate-[bounceLeft_1s_infinite]">
                            <ArrowLeft className="w-12 h-12 stroke-[2.5]" />
                            <span className="text-xs font-bold uppercase tracking-wider">Trái</span>
                          </div>
                        )}
                        {activeStep.direction === 'right' && (
                          <div className="flex items-center gap-1 text-purple-400 animate-[bounceRight_1s_infinite]">
                            <span className="text-xs font-bold uppercase tracking-wider">Phải</span>
                            <ArrowRight className="w-12 h-12 stroke-[2.5]" />
                          </div>
                        )}
                        {activeStep.direction === 'up' && (
                          <div className="flex flex-col items-center gap-1 text-amber-400 animate-[bounceUp_1s_infinite]">
                            <ArrowUp className="w-12 h-12 stroke-[2.5]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Ngước lên</span>
                          </div>
                        )}
                        {activeStep.direction === 'down' && (
                          <div className="flex flex-col items-center gap-1 text-orange-400 animate-[bounceDown_1s_infinite]">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Cúi xuống</span>
                            <ArrowDown className="w-12 h-12 stroke-[2.5]" />
                          </div>
                        )}
                        {activeStep.direction === 'center' && (
                          <div className="flex flex-col items-center gap-1 text-emerald-400/80 animate-pulse">
                            <Sparkles className="w-8 h-8" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Nhìn thẳng</span>
                          </div>
                        )}
                      </div>

                      {/* Corner markers */}
                      <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-violet-400 rounded-tl" />
                      <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-violet-400 rounded-tr" />
                      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-violet-400 rounded-bl" />
                      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-violet-400 rounded-br" />
                    </div>
                  </div>
                )}

                {/* All Steps Success Splash */}
                {aiStatus === 'all_success' && (
                  <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.3s_ease]">
                    <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mb-3 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                    </div>
                    <h4 className="text-xl font-extrabold text-emerald-300">ĐÃ HOÀN TẤT 5 GÓC KHUÔN MẶT!</h4>
                    <p className="text-xs text-emerald-200/90 mt-1 max-w-xs">
                      5 vector đặc trưng đã được lưu vào hệ thống. Kiosk có thể nhận diện nhân viên ở mọi tư thế đứng!
                    </p>
                  </div>
                )}

                {/* Loading state before camera stream */}
                {!stream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-500">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs">Đang mở camera...</p>
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className={`w-full p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                aiStatus === 'all_success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : aiStatus === 'processing' || aiStatus === 'step_success'
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                  : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300'
              }`}>
                {aiStatus === 'processing' ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-violet-400 shrink-0" />
                ) : aiStatus === 'all_success' || aiStatus === 'step_success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Sparkles className="w-5 h-5 text-violet-400 shrink-0 animate-pulse" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{statusMessage}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    AI tự động quét mỗi 2.2s hoặc nhấn "Chụp góc này &amp; Lưu" khi đã chỉnh đúng vị trí.
                  </p>
                </div>
              </div>

              {/* Control Action Buttons */}
              {aiStatus !== 'all_success' && (
                <div className="w-full flex gap-2.5">
                  <button
                    type="button"
                    onClick={resetEnrollment}
                    title="Xoá làm lại từ Bước 1"
                    className="px-3 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>

                  <button
                    type="button"
                    disabled={aiStatus === 'processing' || !stream}
                    onClick={() => runAiDetection()}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {aiStatus === 'processing' 
                      ? 'Đang trích xuất vector...' 
                      : `📸 Chụp ${activeStep.label} & Lưu`}
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* Upload Mode Form */
            <form onSubmit={handleManualUploadSubmit} className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700/60 hover:border-violet-500/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/30 transition-all group"
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-56 rounded-xl object-cover shadow-lg border border-zinc-700" />
                ) : (
                  <>
                    <div className="p-4 bg-zinc-800/60 rounded-2xl group-hover:scale-110 group-hover:bg-violet-500/20 transition-all">
                      <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-violet-400" />
                    </div>
                    <p className="mt-4 text-xs font-medium text-zinc-200">Nhấn để chọn ảnh khuôn mặt từ máy tính</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Hỗ trợ định dạng JPG, PNG chất lượng cao</p>
                  </>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!file || aiStatus === 'processing'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/25"
                >
                  <UploadCloud className="w-4 h-4" /> Tải lên &amp; Lưu
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <span>AI Model: Facenet + RetinaFace / MTCNN</span>
          <span>5-Vector Best Match ($\ge 0.58$)</span>
        </div>

      </div>

      {/* Inline styles for custom scan laser & directional animations */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 10%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        @keyframes bounceLeft {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-8px); }
        }
        @keyframes bounceRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        @keyframes bounceUp {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
      `}</style>
    </div>
  );
}
