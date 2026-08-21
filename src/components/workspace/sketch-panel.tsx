"use client";
/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */
import React, { useRef, useState, useCallback, useEffect } from "react";

type Props = {
  previewUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  error: string | null;
  isAnalyzing: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
};

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

export function SketchPanel({ previewUrl, fileName, fileSize, error, isAnalyzing, onFileSelect, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  useEffect(() => {
    if (!isCameraActive) {
      stopStream();
    }
  }, [isCameraActive, stopStream]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraLoading(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera not supported in this browser. Try uploading a sketch instead.");
      setCameraLoading(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraLoading(false);
    } catch (err: unknown) {
      setCameraLoading(false);
      const e = err as DOMException;
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setCameraError("Camera access was denied. You can upload a sketch instead.");
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        setCameraError("No camera found on this device.");
      } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
        setCameraError("Camera is busy or unavailable. Close other apps and try again.");
      } else if (e.name === "OverconstrainedError") {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play().catch(() => {});
          }
          setCameraError(null);
        } catch {
          setCameraError("Camera unavailable. Please try again or upload a sketch.");
        }
      } else {
        setCameraError("Camera unavailable. Please try again or upload a sketch.");
      }
    }
  }, []);

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [isCameraActive, startCamera]);

  const handleOpenCamera = useCallback(() => {
    setLocalError(null);
    setCameraError(null);
    setIsCameraActive(true);
  }, []);

  const handleCancelCamera = useCallback(() => {
    stopStream();
    setIsCameraActive(false);
    setCameraError(null);
    setCameraLoading(false);
  }, [stopStream]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0) {
      setCameraError("Could not capture. Try again.");
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Capture failed. Try again.");
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Capture failed. Try again.");
          return;
        }
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        stopStream();
        setIsCameraActive(false);
        setCameraError(null);
        onFileSelect(file);
      },
      "image/jpeg",
      0.92
    );
  }, [onFileSelect, stopStream]);

  const validateAndSelect = useCallback(
    (file: File) => {
      setLocalError(null);

      if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
        setLocalError(`Unsupported type: ${file.type || "unknown"}. Use PNG, JPG, JPEG.`);
        return;
      }
      if (file.size > MAX_SIZE) {
        setLocalError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`);
        return;
      }
      if (file.size === 0) {
        setLocalError("Empty file. Please choose a valid image.");
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSelect(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isCameraActive) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isCameraActive) return;
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSelect(f);
  };

  const displayError = localError || error;

  return (
    <div className="group/panel relative flex min-h-[520px] lg:min-h-[560px] flex-col overflow-hidden rounded-[24px] border border-[#3E3E75]/30 bg-[#1d1b2a] shadow-[0_0_0_1px_rgba(62,62,117,0.15)_inset,0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_40px_rgba(0,0,0,0.5)]">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleInputChange} />
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex h-[48px] items-center justify-between border-b border-[#3E3E75]/30 px-5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-[600] uppercase tracking-[0.18em] text-[#a8a6b8]">Your Sketch</span>
          <div className="hidden items-center gap-1.5 rounded-full bg-[#242236] border border-[#3E3E75]/20 px-2.5 py-1 sm:flex">
            {isCameraActive ? (
              <>
                <div className="size-1.5 animate-pulse rounded-full bg-[#45A9A9] shadow-[0_0_8px_rgba(69,169,169,0.6)]" />
                <span className="text-[10px] font-medium tracking-wide text-[#98E8DE]">Live camera</span>
              </>
            ) : previewUrl ? (
              <>
                <div className="size-1.5 rounded-full bg-[#45A9A9] shadow-[0_0_8px_rgba(69,169,169,0.5)]" />
                <span className="text-[10px] font-medium tracking-wide text-[#f0eef6]/70">Loaded</span>
              </>
            ) : (
              <>
                <div className="size-1.5 animate-pulse rounded-full bg-[#4E1F6E]" />
                <span className="text-[10px] font-medium tracking-wide text-[#a8a6b8]">No file</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {previewUrl && !isCameraActive && (
            <button
              onClick={onRemove}
              disabled={isAnalyzing}
              className="rounded-full border border-[#3E3E75]/30 bg-[#242236] px-2.5 py-1 text-[11px] text-[#a8a6b8] hover:text-[#f0eef6] hover:bg-[#2d2b42] disabled:opacity-40"
            >
              Remove
            </button>
          )}
          <div className="flex items-center gap-1.5 text-[#a8a6b8]/40">
            <div className="size-1 rounded-full bg-[#3E3E75]/50" />
            <div className="size-1 rounded-full bg-[#3E3E75]/50" />
            <div className="size-1 rounded-full bg-[#3E3E75]/50" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-1 flex-col items-center justify-center rounded-[16px] border border-dashed bg-[#13111e] px-4 py-6 transition-all duration-300
            ${
              isDragging
                ? "border-[#45A9A9]/50 bg-[#1d1b2a] scale-[1.01]"
                : isCameraActive
                ? "border-[#45A9A9]/30 bg-[#181622]"
                : previewUrl
                ? "border-[#3E3E75]/40 hover:border-[#3E3E75]/60 hover:bg-[#1a1828]"
                : "border-[#3E3E75]/30 hover:border-[#45A9A9]/30 hover:bg-[#1a1828]"
            }`}
        >
          <div className="pointer-events-none absolute inset-0 rounded-[16px] opacity-[0.35] grid-pattern" />
          <div className="pointer-events-none absolute left-3 top-3 size-2.5 border-l border-t border-[#3E3E75]/40" />
          <div className="pointer-events-none absolute right-3 top-3 size-2.5 border-r border-t border-[#3E3E75]/40" />
          <div className="pointer-events-none absolute bottom-3 left-3 size-2.5 border-b border-l border-[#3E3E75]/40" />
          <div className="pointer-events-none absolute bottom-3 right-3 size-2.5 border-b border-r border-[#3E3E75]/40" />

          {isCameraActive ? (
            <div className="relative z-10 flex h-full w-full flex-col items-center">
              <div className="mb-3 flex w-full max-w-[480px] items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-2 animate-ping rounded-full bg-[#45A9A9]/60" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#45A9A9]" />
                  </span>
                  <span className="text-[11px] font-[600] tracking-[0.14em] text-[#98E8DE]">LIVE CAMERA</span>
                </div>
                <span className="text-[10px] tracking-wide text-[#a8a6b8]/50">Rear preferred • Secure context</span>
              </div>

              <div className="relative flex w-full max-w-[480px] aspect-[4/3] items-center justify-center overflow-hidden rounded-[16px] border border-[#3E3E75]/40 bg-black shadow-2xl">
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

                {cameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="flex items-center gap-2 rounded-full bg-[#4E1F6E] px-3 py-1.5 text-[12px] font-medium text-[#f0eef6] shadow-[0_0_12px_rgba(78,31,110,0.4)]">
                      <div className="size-3 animate-spin rounded-full border-2 border-[#f0eef6]/20 border-t-[#98E8DE]" />
                      Starting camera...
                    </div>
                  </div>
                )}

                {!cameraLoading && !cameraError && (
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/2 top-1/2 h-[72%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border-2 border-dashed border-[#45A9A9]/70 shadow-[0_0_0_200vmax_rgba(0,0,0,0.35)]">
                      <div className="absolute -left-1 -top-1 size-4 border-l-2 border-t-2 border-[#98E8DE] rounded-tl-[10px]" />
                      <div className="absolute -right-1 -top-1 size-4 border-r-2 border-t-2 border-[#98E8DE] rounded-tr-[10px]" />
                      <div className="absolute -left-1 -bottom-1 size-4 border-l-2 border-b-2 border-[#98E8DE] rounded-bl-[10px]" />
                      <div className="absolute -right-1 -bottom-1 size-4 border-r-2 border-b-2 border-[#98E8DE] rounded-br-[10px]" />
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#98E8DE]/80 to-transparent animate-[scan_2.5s_ease-in-out_infinite]" />
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 backdrop-blur border border-[#45A9A9]/20">
                      <span className="text-[11px] font-medium tracking-wide text-[#98E8DE]">Place your sketch inside the frame</span>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#13111e]/90 backdrop-blur-sm p-6">
                    <div className="flex w-full max-w-[300px] flex-col items-center rounded-[14px] border border-[#4E1F6E]/30 bg-[#4E1F6E]/15 px-5 py-5 text-center">
                      <div className="flex size-8 items-center justify-center rounded-full bg-[#4E1F6E]/30 text-[#98E8DE]">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <circle cx="8" cy="8" r="5.5" />
                          <path d="M8 5V8M8 11H8.01" strokeLinecap="round" />
                        </svg>
                      </div>
                      <p className="mt-3 text-[12.5px] leading-[1.5] text-[#f0eef6]">{cameraError}</p>
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="mt-4 rounded-full bg-[#4E1F6E] px-4 py-1.5 text-[12px] font-semibold text-[#f0eef6] hover:bg-[#5e2585]"
                      >
                        Upload Sketch instead
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex w-full max-w-[480px] flex-col gap-2.5">
                <button
                  onClick={handleCapture}
                  disabled={!!cameraError || cameraLoading}
                  className="inline-flex h-[44px] w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#4E1F6E] to-[#3E3E75] px-6 text-[14px] font-[600] tracking-[-0.01em] text-[#f0eef6] shadow-[0_0_0_1px_rgba(78,31,110,0.3)_inset,0_1px_2px_rgba(0,0,0,0.4),0_0_16px_rgba(78,31,110,0.25)] transition-all hover:from-[#5e2585] hover:to-[#4a4a8a] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#f0eef6] text-[#4E1F6E]">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <circle cx="5" cy="5" r="4" />
                    </svg>
                  </span>
                  Capture Sketch
                </button>

                <div className="flex gap-2.5">
                  <button
                    onClick={handleCancelCamera}
                    className="inline-flex h-[40px] flex-1 items-center justify-center rounded-full border border-[#3E3E75]/40 bg-[#242236] px-5 text-[13px] font-[500] text-[#a8a6b8] hover:bg-[#2d2b42] hover:text-[#f0eef6]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex h-[40px] flex-1 items-center justify-center rounded-full border border-[#3E3E75]/20 bg-transparent px-5 text-[13px] text-[#a8a6b8]/70 hover:text-[#98E8DE]"
                  >
                    Upload instead
                  </button>
                </div>

                <p className="text-center text-[11px] tracking-wide text-[#a8a6b8]/40">Camera runs entirely in browser • No cloud storage • Capture → Analyze</p>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="relative z-10 flex h-full w-full flex-col items-center">
              <div className="relative flex w-full max-w-[420px] flex-1 items-center justify-center overflow-hidden rounded-[12px] border border-[#3E3E75]/40 bg-[#0f0e17] shadow-2xl">
                <img src={previewUrl} alt="Sketch preview" className="max-h-[380px] w-full object-contain" draggable={false} />
                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#13111e]/70 backdrop-blur-[2px]">
                    <div className="flex items-center gap-2 rounded-full bg-[#45A9A9] px-3 py-1.5 text-[12px] font-medium text-[#13111e]">
                      <div className="size-3 animate-spin rounded-full border-2 border-[#13111e]/20 border-t-[#13111e]" />
                      Analyzing...
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex w-full max-w-[420px] items-center justify-between rounded-[10px] border border-[#3E3E75]/30 bg-[#1d1b2a] px-3 py-2">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex size-8 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#4E1F6E] to-[#45A9A9] text-[#f0eef6] text-[10px] font-bold">IMG</div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="max-w-[160px] truncate text-[12px] font-medium tracking-[-0.01em] text-[#f0eef6]/80">{fileName}</span>
                    <span className="text-[11px] text-[#a8a6b8]/60">
                      {fileSize ? `${(fileSize / 1024).toFixed(0)} KB` : ""} • ready to analyze
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleOpenCamera}
                    disabled={isAnalyzing}
                    className="rounded-full border border-[#3E3E75]/30 bg-[#242236] px-3 py-1 text-[11px] font-medium text-[#a8a6b8] hover:text-[#98E8DE] hover:bg-[#2d2b42] disabled:opacity-40"
                  >
                    Retake
                  </button>
                  <button
                    onClick={() => inputRef.current?.click()}
                    disabled={isAnalyzing}
                    className="rounded-full bg-[#4E1F6E] px-3 py-1 text-[11px] font-semibold text-[#f0eef6] hover:bg-[#5e2585] disabled:opacity-50"
                  >
                    Replace
                  </button>
                </div>
              </div>

              <p className="mt-3 text-[11px] tracking-wide text-[#a8a6b8]/50">Upload or camera → same pipeline → Analyze</p>
            </div>
          ) : (
            <div className="relative z-10 flex w-full max-w-[300px] flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute -inset-6 -z-10 rounded-full bg-gradient-to-br from-[#4E1F6E]/15 to-[#45A9A9]/10 blur-xl" />
                <div className="flex size-[56px] items-center justify-center rounded-[16px] border border-[#3E3E75]/30 bg-[#242236] shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_0_1px_rgba(62,62,117,0.15)_inset]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#98E8DE]">
                    <path d="M12 16V4M12 4L9 7M12 4L15 7M4 20H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-[#13111e] bg-[#4E1F6E] text-[10px] font-bold text-[#f0eef6]">
                  +
                </div>
              </div>

              <h3 className="text-[17px] font-[550] tracking-[-0.015em] text-[#f0eef6]">Drop your sketch here</h3>
              <p className="mt-1.5 text-center text-[13px] leading-[1.5] text-[#a8a6b8]">
                Drag & drop a photo of your hand-drawn UI. <br className="hidden sm:block" />
                PNG, JPG or HEIC — up to 10MB.
              </p>

              <div className="mt-6 flex w-full flex-col gap-2.5">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-full bg-[#4E1F6E] px-5 text-[13.5px] font-[550] tracking-[-0.01em] text-[#f0eef6] shadow-[0_0_0_1px_rgba(78,31,110,0.3)_inset,0_1px_2px_rgba(0,0,0,0.4),0_0_12px_rgba(78,31,110,0.2)] transition-all hover:bg-[#5e2585] active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <rect x="2" y="3" width="12" height="9" rx="2" />
                    <circle cx="5.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    <path d="M2.5 10.5L5 8L8 10.5L11 7L13.5 10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Upload Sketch
                </button>

                <button
                  onClick={handleOpenCamera}
                  className="inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-full border border-[#3E3E75]/40 bg-[#1d1b2a] px-5 text-[13.5px] font-[500] tracking-[-0.01em] text-[#a8a6b8] backdrop-blur transition-all hover:bg-[#242236] hover:text-[#98E8DE] hover:border-[#45A9A9]/30 active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <rect x="2" y="3" width="12" height="9" rx="2.5" />
                    <circle cx="8" cy="7.5" r="2" />
                    <path d="M6 3L7 2H9L10 3" strokeLinecap="round" />
                  </svg>
                  Use Camera
                </button>
              </div>

              {displayError && (
                <div className="mt-4 w-full rounded-[12px] border border-[#4E1F6E]/30 bg-[#4E1F6E]/15 px-3 py-2.5 text-[12px] leading-[1.4] text-[#f0eef6]">
                  {displayError}
                </div>
              )}

              <p className="mt-4 text-[11px] tracking-wide text-[#a8a6b8]/50">Image stays in browser memory — no cloud storage</p>
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex h-[68px] items-center gap-3 rounded-[12px] border border-[#3E3E75]/30 bg-[#1d1b2a] px-3.5">
            <div className="flex size-10 items-center justify-center rounded-[9px] border border-[#3E3E75]/30 bg-[#242236]">
              {previewUrl ? (
                <img src={previewUrl} alt="thumb" className="size-8 rounded-[6px] object-cover" />
              ) : isCameraActive ? (
                <div className="flex size-8 items-center justify-center rounded-[6px] bg-[#45A9A9]/20 text-[#45A9A9]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="8" cy="7.5" r="2" />
                    <rect x="2" y="3" width="12" height="9" rx="2.5" />
                  </svg>
                </div>
              ) : (
                <div className="h-5 w-6 rounded-[3px] border border-[#3E3E75]/50 bg-[#2d2b42]" />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className={`h-[6px] rounded-full ${previewUrl ? "w-[84px] bg-[#f0eef6]/60" : isCameraActive ? "w-[84px] bg-[#45A9A9]/40" : "w-[84px] bg-[#a8a6b8]/20"}`} />
              <div className={`h-[5px] rounded-full ${previewUrl ? "w-[100px] bg-[#a8a6b8]/30" : isCameraActive ? "w-[56px] bg-[#a8a6b8]/20" : "w-[56px] bg-[#a8a6b8]/10"}`} />
            </div>
            <div className="ml-auto h-5 w-5 rounded-full border border-[#3E3E75]/20 bg-[#242236]" />
          </div>
          <div className="hidden h-[68px] items-center gap-3 rounded-[12px] border border-dashed border-[#3E3E75]/20 bg-transparent px-3.5 sm:flex">
            <div className="size-10 rounded-[9px] border border-dashed border-[#3E3E75]/30 bg-[#1d1b2a]/50" />
            <div className="flex flex-col gap-1.5">
              <div className="h-[6px] w-[64px] rounded-full bg-[#2d2b42]" />
              <div className="h-[5px] w-[48px] rounded-full bg-[#242236]" />
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-20 left-1/2 h-40 w-[80%] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#4E1F6E]/15 to-[#45A9A9]/10 blur-3xl" />

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(80px); opacity: 1; }
          100% { transform: translateY(160px); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
