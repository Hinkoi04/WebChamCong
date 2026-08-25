import os
import urllib.request
import shutil
import uuid
import base64
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File, HTTPException
import uvicorn

app = FastAPI(title="Ultra-Lightweight Face Recognition Service")

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

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "opencv-sface-ai", "memory": "ultra-low"}

@app.get("/")
def root():
    return {"status": "ok", "message": "Ultra-Fast Face Recognition AI Service is running"}

def crop_face_to_base64(image_path: str, fx: int, fy: int, fw: int, fh: int) -> str:
    """Cắt riêng vùng khuôn mặt với margin đệm 20% và trả về ảnh Base64 JPEG chân dung cận cảnh tỉ lệ 1:1"""
    img = cv2.imread(image_path)
    if img is None:
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
async def extract_face(file: UploadFile = File(...)):
    file_location = f"temp_{uuid.uuid4().hex}_{file.filename}"
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)

        img = cv2.imread(file_location)
        if img is None:
            raise HTTPException(status_code=400, detail="Không thể đọc file ảnh, vui lòng thử lại ảnh hợp lệ.")

        h, w, _ = img.shape
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
                    faces[:, :4] = faces[:, :4] / scale

        if faces is None or len(faces) == 0:
            raise HTTPException(status_code=400, detail="Không tìm thấy khuôn mặt trong ảnh, vui lòng thử lại ảnh rõ nét hơn.")

        # Sắp xếp lấy khuôn mặt có độ tin cậy cao nhất
        faces = sorted(faces, key=lambda f: f[-1], reverse=True)
        best_face = faces[0]
        
        fx, fy, fw, fh = int(best_face[0]), int(best_face[1]), int(best_face[2]), int(best_face[3])
        confidence = float(best_face[-1])
        
        aligned_face = recognizer.alignCrop(img, best_face)
        embedding = recognizer.feature(aligned_face)[0].tolist()

        cropped_image = crop_face_to_base64(file_location, fx, fy, fw, fh)

        if os.path.exists(file_location):
            os.remove(file_location)

        return {
            "embedding": embedding,
            "face_confidence": confidence,
            "facial_area": {"x": fx, "y": fy, "w": fw, "h": fh},
            "cropped_image": cropped_image
        }

    except HTTPException:
        if os.path.exists(file_location):
            os.remove(file_location)
        raise
    except Exception as e:
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
