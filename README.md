# INK UI
> From sketch to interactive.

Turn a hand-drawn interface into a working prototype.

## Current Status: Step 4 — Camera Capture

Full hackathon demo flow: **Camera / Upload → AI → JSON → Interactive Prototype**

### What's working in Step 4
- **Camera Capture**: `Use Camera` button now functional using `navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } })`.
- **Camera UI**: When active, replaces empty state with live preview, `LIVE CAMERA` pulsing indicator, video feed (object-cover), subtle framing guide (78%×72% dashed rounded rectangle + corner accents + scan-line animation), text "Place your sketch inside the frame", controls `[Capture Sketch]` (primary) `[Cancel]` + Upload fallback.
- **Framing Guide**: Visual only, no CV edge detection — centered dashed border with dimmed outside (box-shadow 200vmax rgba) and corner marks.
- **Capture**: Draws current video frame to hidden `<canvas>`, `toBlob(..., 'image/jpeg', 0.92)` → `File(capture-{timestamp}.jpg)`, stops stream immediately, exits camera mode, shows captured image in existing preview, enables Analyze.
- **Pipeline Reuse**: Captured File → same `onFileSelect` → same `ObjectURL` preview → same `POST /api/analyze` → same validation → same `PrototypeRenderer`. No second endpoint.
- **Stream Cleanup**: `stopStream()` = `stream.getTracks().forEach(t=>t.stop())` + `srcObject=null`, called on Cancel, Capture, cameraActive false, and `useEffect` unmount cleanup. No background camera.
- **Permission Errors**: Handles NotAllowedError → "Camera access was denied. You can upload a sketch instead.", NotFoundError → "No camera found", NotReadableError, OverconstrainedError with fallback to generic video, unsupported → "Camera not supported...". Shows friendly red card + Upload button fallback, never crashes.
- **Mobile/Desktop**: Prefers rear camera, preview aspect 4/3 responsive max-w 480px, easy 44px capture button, no horizontal overflow. Desktop uses webcam, keeps workspace layout.
- **Preserved Upload**: Upload and Camera both produce same result, share validation (PNG/JPG/WEBP, 10MB). Preview shows Retake (camera) + Replace (upload).

### Architecture
```
Upload Sketch ──┐
                ├→ File → FormData → POST /api/analyze → validated JSON → PrototypeRenderer → Interactive UI (+ dashboard)
Camera ─────────┘
  └→ getUserMedia (environment) → video → canvas capture → File ─┘
```

No automatic frame analysis — only on user Capture → Analyze (saves API calls).

### Files changed
- **Modified:** `src/components/workspace/sketch-panel.tsx` — complete rewrite for Step 4: added camera states (isCameraActive, cameraLoading, cameraError), refs videoRef/canvasRef/streamRef, startCamera with facingMode ideal environment + fallback, handleOpen/Cancel/Capture, stopStream cleanup, camera UI with framing guide overlay, scan animation, error handling, preview now has Retake + Replace.
- **Unchanged (per spec):** `src/app/api/analyze/route.ts`, `src/lib/ui-schema.ts`, `src/lib/prompt.ts`, `src/components/prototype/PrototypeRenderer.tsx`, `src/components/workspace/prototype-panel.tsx` (touched only if needed but preserved logic).

### Camera implementation details
- Uses browser native API only, no backend
- `facingMode: { ideal: "environment" }`, width ideal 1280, height 720
- Video: `autoPlay playsInline muted`
- Capture: canvas width = videoWidth, height = videoHeight, `drawImage(video,0,0,w,h)`, blob JPEG
- Error mapping as above
- HTTPS: notes localhost secure context is allowed; no custom backend

### How captured images enter existing pipeline
1. `canvas.toBlob` → `File`
2. `onFileSelect(file)` → parent page creates ObjectURL, sets file state
3. User clicks Analyze → `FormData.append('image', file)` → `fetch('/api/analyze')` → OpenAI vision → validated JSON → `PrototypeRenderer`

### How to test
```bash
npm install
cp .env.example .env.local # add OPENAI_API_KEY
npm run dev # https or localhost
```
**Camera demo flow:**
1. Open http://localhost:3000
2. Click Use Camera → browser requests permission
3. Live preview appears with framing guide
4. Hold hand-drawn login sketch: `LOGIN / [Username] / [Password] / [SIGN IN]`
5. Place inside frame → Capture Sketch
6. Captured image appears in sketch panel
7. Click Analyze Sketch → AI → Prototype Ready on right
8. Type in inputs, Click SIGN IN → Dashboard opens
9. Toggle Desktop/Mobile, Reset

**Upload flow still works:** Drop PNG/JPG or click Upload Sketch → same Analyze → prototype.

**Permission tests:** Deny → shows "Camera access was denied..." + Upload button; no crash.

### Build / lint
```bash
npm run lint # pass
npm run build # pass, routes: / static, /api/analyze dynamic
```

### Known limitations
- No code export, no DB/auth (by design)
- No real-time edge detection, just visual guide
- No auto analysis — manual Capture → Analyze required (intentional to save API calls)
- Captured JPEG quality 0.92, no filters/enhancements
- Mobile rear camera preferred but fallback to any camera if overconstrained

---
Step 3 renderer preserved, Step 4 adds magical camera → prototype demo.
