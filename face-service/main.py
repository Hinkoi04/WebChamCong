import os
import urllib.request
import base64
import threading
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Ultra-Lightweight Face Recognition Service")

# Allow CORS for direct health checks and local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model paths
YUNET_PATH = "face_detection_yunet_2023mar.onnx"
SFACE_PATH = "face_recognition_sface_2021dec.onnx"

YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

# Ensure ONNX models are available
def ensure_models():
    if not os.path.exists(YUNET_PATH):
        print(f"Downloading YuNet model ({YUNET_PATH})...")
        urllib.request.urlretrieve(YUNET_URL, YUNET_PATH)
    if not os.path.exists(SFACE_PATH):
        print(f"Downloading SFace model ({SFACE_PATH})...")
        urllib.request.urlretrieve(SFACE_URL, SFACE_PATH)

ensure_models()

# Initialize OpenCV AI detectors (Ultra-lightweight ~40MB RAM)
detector = cv2.FaceDetectorYN.create(YUNET_PATH, "", (320, 320), 0.4, 0.25, 5000)
recognizer = cv2.FaceRecognizerSF.create(SFACE_PATH, "")

# Thread safety lock for OpenCV detector setInputSize & inference
ai_lock = threading.Lock()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "opencv-sface-ai", "memory": "ultra-low"}

@app.get("/")
def root():
    return {"status": "ok", "message": "Ultra-Fast Face Recognition AI Service is running"}

def crop_face_to_base64(img: np.ndarray, fx: int, fy: int, fw: int, fh: int) -> str:
    """Cắt riêng vùng khuôn mặt trong bộ nhớ với margin đệm 20% và trả về ảnh Base64 JPEG chân dung cận cảnh tỉ lệ 1:1"""
    if img is None or img.size == 0:
        return None
    h, w, _ = img.shape

    margin_x = int(fw * 0.20)
    margin_y = int(fh * 0.20)

    x1 = max(0, fx - margin_x)
    y1 = max(0, fy - margin_y)
    x2 = min(w, fx + fw + margin_x)
    y2 = min(h, fy + fh + margin_y)

    cropped = img[y1:y2, x1:x2]
    if cropped.size == 0:
        cropped = img

    if cropped.shape[0] > 400 or cropped.shape[1] > 400:
        cropped = cv2.resize(cropped, (300, 300), interpolation=cv2.INTER_AREA)

    _, buffer = cv2.imencode(".jpg", cropped, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    b64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"

@app.post("/api/v1/extract")
async def extract_face(
    file: UploadFile = File(...),
    expected_pose: str = None
):
    try:
        # Đọc trực tiếp nội dung file vào RAM (Zero Disk I/O, cực nhanh và không tạo file rác)
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="File ảnh rỗng.")

        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Không thể đọc định dạng ảnh, vui lòng thử lại ảnh hợp lệ.")

        h, w, _ = img.shape

        with ai_lock:
            detector.setInputSize((w, h))
            _, faces = detector.detect(img)
            
            if faces is None or len(faces) == 0:
                # Retry with smaller scale if high-res image
                if max(h, w) > 1000:
                    scale = 800.0 / max(h, w)
                    resized = cv2.resize(img, (int(w * scale), int(h * scale)))
                    detector.setInputSize((resized.shape[1], resized.shape[0]))
                    _, faces_resized = detector.detect(resized)
                    if faces_resized is not None and len(faces_resized) > 0:
                        faces = faces_resized
                        # Scale toàn bộ toạ độ box + 5 điểm landmarks (14 phần tử) về toạ độ ảnh gốc
                        faces[:, :14] = faces[:, :14] / scale

            if faces is None or len(faces) == 0:
                raise HTTPException(status_code=400, detail="Không tìm thấy khuôn mặt trong ảnh, vui lòng thử lại ảnh rõ nét hơn.")

            # Sắp xếp lấy khuôn mặt có độ tin cậy cao nhất
            faces = sorted(faces, key=lambda f: f[-1], reverse=True)
            best_face = faces[0]
            
            fx, fy, fw, fh = int(best_face[0]), int(best_face[1]), int(best_face[2]), int(best_face[3])
            confidence = float(best_face[-1])

            # Phân tích tư thế hướng mặt (Head Pose Estimation) dựa trên Landmark YuNet
            # Landmark: [re_x, re_y, le_x, le_y, nt_x, nt_y, rm_x, rm_y, lm_x, lm_y]
            re_x, re_y = float(best_face[4]), float(best_face[5])
            le_x, le_y = float(best_face[6]), float(best_face[7])
            nt_x, nt_y = float(best_face[8]), float(best_face[9])

            d_re = abs(nt_x - re_x)
            d_le = abs(nt_x - le_x)
            total_eye_span = d_re + d_le

            if total_eye_span > 0:
                yaw_ratio = d_re / total_eye_span
            else:
                yaw_ratio = 0.5

            # Khi quay sang TRÁI của người dùng: Mũi dịch sang phải ảnh (gần mắt trái trong ảnh hơn) -> d_re lớn -> yaw_ratio > 0.58
            # Khi quay sang PHẢI của người dùng: Mũi dịch sang trái ảnh (gần mắt phải trong ảnh hơn) -> d_re nhỏ -> yaw_ratio < 0.42
            # Khi nhìn THẲNG: 0.42 <= yaw_ratio <= 0.58
            if yaw_ratio > 0.58:
                detected_pose = "left"
            elif yaw_ratio < 0.42:
                detected_pose = "right"
            else:
                detected_pose = "center"

            # Bẫy lỗi khi hướng mặt không đúng yêu cầu
            if expected_pose:
                expected = expected_pose.lower().strip()
                if expected == "left":
                    if detected_pose == "right":
                        raise HTTPException(status_code=400, detail="Bạn đang quay mặt sang PHẢI. Vui lòng quay sang bên TRÁI của bạn!")
                    elif detected_pose == "center":
                        raise HTTPException(status_code=400, detail="Chưa đủ độ nghiêng. Vui lòng nghiêng mặt sang bên TRÁI của bạn (khoảng 15-25 độ)!")
                elif expected == "right":
                    if detected_pose == "left":
                        raise HTTPException(status_code=400, detail="Bạn đang quay mặt sang TRÁI. Vui lòng quay sang bên PHẢI của bạn!")
                    elif detected_pose == "center":
                        raise HTTPException(status_code=400, detail="Chưa đủ độ nghiêng. Vui lòng nghiêng mặt sang bên PHẢI của bạn (khoảng 15-25 độ)!")
                elif expected in ["center", "front"]:
                    if detected_pose in ["left", "right"]:
                        raise HTTPException(status_code=400, detail="Vui lòng nhìn THẲNG chính diện vào camera!")
            
            aligned_face = recognizer.alignCrop(img, best_face)
            embedding = recognizer.feature(aligned_face)[0].tolist()

            cropped_image = crop_face_to_base64(img, fx, fy, fw, fh)

        return {
            "embedding": embedding,
            "face_confidence": confidence,
            "detected_pose": detected_pose,
            "yaw_ratio": round(yaw_ratio, 3),
            "facial_area": {"x": fx, "y": fy, "w": fw, "h": fh},
            "cropped_image": cropped_image
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

