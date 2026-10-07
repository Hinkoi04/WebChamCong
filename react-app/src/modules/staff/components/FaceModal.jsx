import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, UploadCloud, Camera, Image as ImageIcon, Video, CheckCircle2, 
  Sparkles, RefreshCw, Check, ArrowLeft, ArrowRight, RotateCcw,
  FlipHorizontal
} from 'lucide-react';
import { staffService } from '../services/staffService';
import { useToast } from '../../../contexts/ToastContext';

const FACE_STEPS = [
  {
    id: 1,
    key: 'front',
    label: 'Chính diện',
    badge: '🟢 Góc 1/3',
    title: 'Nhìn thẳng chính diện',
    hint: 'Giữ khuôn mặt cân bằng và nhìn trực tiếp vào camera',
    direction: 'center',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ringStyle: 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    laserStyle: 'from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399]',
  },
  {
    id: 2,
    key: 'left',
    label: 'Nghiêng trái',
    badge: '🔵 Góc 2/3',
    title: 'Nghiêng nhẹ sang trái',
    hint: 'Quay mặt sang bên TRÁI của bạn (khoảng 15-25 độ)',
    direction: 'left',
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
    ringStyle: 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    laserStyle: 'from-transparent via-blue-400 to-transparent shadow-[0_0_8px_#60a5fa]',
  },
  {
    id: 3,
    key: 'right',
    label: 'Nghiêng phải',
    badge: '🟣 Góc 3/3',
    title: 'Nghiêng nhẹ sang phải',
    hint: 'Quay mặt sang bên PHẢI của bạn (khoảng 15-25 độ)',
    direction: 'right',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
    ringStyle: 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    laserStyle: 'from-transparent via-purple-400 to-transparent shadow-[0_0_8px_#c084fc]',
  },
];

export default function FaceModal({ isOpen, onClose, staff, onSuccess }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState('camera'); // 'camera' | 'upload'
  const [isMirrored, setIsMirrored] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [stream, setStream] = useState(null);

  // 3-Step Enrollment State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStepIndexRef = useRef(0);

  const [completedSteps, setCompletedSteps] = useState([false, false, false]);
  const [stepPreviews, setStepPreviews] = useState(['', '', '']);
  const capturedFramesRef = useRef([null, null, null]);
  
  // AI Scanning States
  const [aiStatus, setAiStatus] = useState('idle');
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

  const resetEnrollment = useCallback(() => {
    currentStepIndexRef.current = 0;
    setCurrentStepIndex(0);
    setCompletedSteps([false, false, false]);
    setStepPreviews(['', '', '']);
    capturedFramesRef.current = [null, null, null];
    updateAiStatus('detecting', 'Đang khởi động quy trình đăng ký 3 góc...');
    isProcessingRef.current = false;
  }, [updateAiStatus]);

  const captureFrame = useCallback(() => {
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

    const stepIdx = currentStepIndexRef.current;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const capturedFile = new File([blob], `staff_${staff?.id}_step${stepIdx + 1}.jpg`, { type: 'image/jpeg' });
        resolve(capturedFile);
      }, 'image/jpeg', 0.9);
    });
  }, [staff]);

  const runAiDetection = useCallback(async () => {
    if (!isOpen || isProcessingRef.current || !orgId || !staff || aiStatusRef.current === 'all_success' || aiStatusRef.current === 'step_success') return;

    const stepIdx = currentStepIndexRef.current;
    if (stepIdx >= FACE_STEPS.length) return;

    const currentStep = FACE_STEPS[stepIdx];
    const frameFile = await captureFrame();
    if (!frameFile) return;

    isProcessingRef.current = true;
    updateAiStatus('processing', `AI đang phân tích góc ${currentStep.id}/3: ${currentStep.label}...`);

    try {
      await staffService.validateFace(orgId, staff.id, frameFile, currentStep.direction);

      capturedFramesRef.current[stepIdx] = frameFile;
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
        const nextIdx = stepIdx + 1;
        currentStepIndexRef.current = nextIdx;
        setCurrentStepIndex(nextIdx);
        
        updateAiStatus('step_success', `✅ Đã nhận diện ${currentStep.label}! Hãy ${FACE_STEPS[nextIdx].hint}...`);

        setTimeout(() => {
          updateAiStatus('detecting', `AI đang quét góc ${FACE_STEPS[nextIdx].id}/3: ${FACE_STEPS[nextIdx].title}...`);
          isProcessingRef.current = false;
        }, 1400);
      } else {
        updateAiStatus('processing', '🎉 Đang hoàn tất và lưu bộ 3 góc khuôn mặt vào hệ thống...');
        
        const allFiles = capturedFramesRef.current.filter(Boolean);
        const allPoses = FACE_STEPS.map((s) => s.direction);
        await staffService.batchUploadFaces(orgId, staff.id, allFiles, allPoses);

        updateAiStatus('all_success', '🎉 Đã hoàn tất đăng ký đủ 3 góc khuôn mặt!');
        stopCamera();
        showToast(`Đã tự động thu thập và đăng ký 3 góc khuôn mặt cho ${staff.fullName}`, 'success');

        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1800);
      }
    } catch (err) {
      const backendMsg = err.response?.data?.message || err.response?.data?.detail;
      if (backendMsg) {
        updateAiStatus('error', `⚠️ ${backendMsg}`);
        showToast(backendMsg, 'warning');
      } else {
        updateAiStatus('detecting', `Chưa phát hiện góc ${currentStep.label}, vui lòng căn chỉnh theo hướng dẫn`);
      }
      isProcessingRef.current = false;
    }
  }, [isOpen, orgId, staff, captureFrame, stopCamera, showToast, onSuccess, onClose, updateAiStatus]);

  const runAiDetectionRef = useRef(runAiDetection);
  useEffect(() => {
    runAiDetectionRef.current = runAiDetection;
  }, [runAiDetection]);

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

      setTimeout(() => {
        updateAiStatus('detecting', `AI đang tự động quét góc 1/3: Nhìn thẳng chính diện...`);
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

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Đăng ký 3 góc khuôn mặt AI
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Multi-Angle AI
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhân viên: <span className="font-semibold text-slate-800">{staff.fullName}</span> ({staff.staffCode})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/40 p-1.5 gap-2">
          <button
            type="button"
            onClick={() => { setMode('camera'); }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'camera'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Video className="w-4 h-4" /> Quét 3 góc tự động (AI Scan)
          </button>
          <button
            type="button"
            onClick={() => { stopCamera(); setMode('upload'); }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'upload'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Tải ảnh thủ công
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {mode === 'camera' ? (
            <div className="flex flex-col items-center gap-3.5">

              {/* 3-Step Interactive Progress Bar */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-inner">
                <div className="flex items-center justify-between gap-1 mb-2">
                  {FACE_STEPS.map((step, idx) => {
                    const isDone = completedSteps[idx];
                    const isCurrent = idx === currentStepIndex && aiStatus !== 'all_success';
                    return (
                      <div key={step.id} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          isDone
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : isCurrent
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse scale-105 shadow-sm'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                        </div>
                        <span className={`text-[10px] font-medium transition-colors ${
                          isDone ? 'text-emerald-700 font-semibold' : isCurrent ? 'text-indigo-700 font-bold' : 'text-slate-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar line */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-indigo-600 to-indigo-500 transition-all duration-500"
                    style={{ 
                      width: `${aiStatus === 'all_success' ? 100 : (completedSteps.filter(Boolean).length / 3) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Current Step Instruction Banner */}
              {aiStatus !== 'all_success' && (
                <div className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${activeStep.badgeStyle}`}>
                      {activeStep.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{activeStep.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 italic">{activeStep.hint}</span>
                </div>
              )}
              
              {/* Camera Scanner Viewport */}
              <div className="relative w-full aspect-4/3 sm:aspect-video rounded-2xl overflow-hidden bg-black border-2 border-slate-200 shadow-xl flex items-center justify-center">
                
                {/* Live Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover will-change-transform transform-gpu ${
                    isMirrored ? '-scale-x-100' : ''
                  } ${aiStatus === 'all_success' ? 'opacity-25' : 'opacity-100'}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Mirror Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMirrored(prev => !prev)}
                  title={isMirrored ? 'Đang bật lật ảnh gương (Selfie). Nhấn để tắt' : 'Đang tắt lật ảnh gương. Nhấn để bật'}
                  className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer shadow-lg"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                {/* AI Target Biometric Oval Frame with Dynamic Directional Cue */}
                {aiStatus !== 'all_success' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`relative w-48 h-60 sm:w-56 sm:h-72 rounded-[45%] border-2 border-dashed transition-colors duration-300 ${
                      aiStatus === 'processing' || aiStatus === 'step_success'
                        ? 'border-indigo-400 shadow-[0_0_35px_rgba(99,102,241,0.6)]'
                        : activeStep.ringStyle
                    }`}>
                      
                      {/* Laser scanning line */}
                      <div className={`absolute left-0 right-0 h-1 bg-gradient-to-r ${activeStep.laserStyle} animate-[scanLaser_2.0s_ease-in-out_infinite]`} />
                      
                      {/* Directional Cue Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center text-white/50">
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
                        {activeStep.direction === 'center' && (
                          <div className="flex flex-col items-center gap-1 text-emerald-400 animate-pulse">
                            <Sparkles className="w-8 h-8" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Nhìn thẳng</span>
                          </div>
                        )}
                      </div>

                      {/* Corner markers */}
                      <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400 rounded-tl" />
                      <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400 rounded-tr" />
                      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400 rounded-bl" />
                      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400 rounded-br" />
                    </div>
                  </div>
                )}

                {/* All Steps Success Splash */}
                {aiStatus === 'all_success' && (
                  <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.3s_ease]">
                    <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mb-3 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                    </div>
                    <h4 className="text-xl font-extrabold text-emerald-300">ĐÃ HOÀN TẤT 3 GÓC KHUÔN MẶT!</h4>
                    <p className="text-xs text-emerald-200/90 mt-1 max-w-xs">
                      3 vector đặc trưng (Chính diện, Trái, Phải) đã được lưu thành công.
                    </p>
                  </div>
                )}

                {/* Loading state before camera stream */}
                {!stream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs">Đang mở camera...</p>
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className={`w-full p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                aiStatus === 'all_success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : aiStatus === 'processing' || aiStatus === 'step_success'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  : aiStatus === 'error'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                {aiStatus === 'processing' ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-600 shrink-0" />
                ) : aiStatus === 'all_success' || aiStatus === 'step_success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 animate-pulse" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{statusMessage}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
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
                    className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-2xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>

                  <button
                    type="button"
                    disabled={aiStatus === 'processing' || !stream}
                    onClick={() => runAiDetection()}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group"
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-56 rounded-xl object-cover shadow-md border border-slate-200" />
                ) : (
                  <>
                    <div className="p-4 bg-slate-100 rounded-2xl group-hover:scale-105 group-hover:bg-indigo-50 transition-all">
                      <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <p className="mt-4 text-xs font-medium text-slate-700">Nhấn để chọn ảnh khuôn mặt từ máy tính</p>
                    <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ định dạng JPG, PNG chất lượng cao</p>
                  </>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!file || aiStatus === 'processing'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" /> Tải lên &amp; Lưu
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>AI Model: SFace + YuNet Detector</span>
          <span>3-Vector Multi-Angle Match (Chính diện - Trái - Phải)</span>
        </div>

      </div>

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
      `}</style>
    </div>
  );
}
