import os
# Tối ưu hóa môi trường TensorFlow & DeepFace cho Cloud CPU
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

from fastapi import FastAPI, UploadFile, File, HTTPException
import uvicorn
import shutil
import uuid
import cv2
import base64

app = FastAPI(title="Face Recognition Service")

_deepface = None

def get_deepface():
    global _deepface
    if _deepface is None:
        from deepface import DeepFace
        _deepface = DeepFace
    return _deepface

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "face-recognition"}

@app.get("/")
def root():
    return {"status": "ok", "message": "Face Recognition AI Service is running"}

def crop_face_to_base64(image_path: str, facial_area: dict) -> str:
    """Cắt riêng vùng khuôn mặt với margin đệm 20% và trả về ảnh Base64 JPEG chân dung cận cảnh tỉ lệ 1:1"""
    img = cv2.imread(image_path)
    if img is None:
        return None
    h, w, _ = img.shape
    fx = facial_area.get("x", 0)
    fy = facial_area.get("y", 0)
    fw = facial_area.get("w", w)
    fh = facial_area.get("h", h)

    # Thêm margin đệm 20% xung quanh khuôn mặt để có ảnh chân dung 1:1 chuẩn xác
    margin_x = int(fw * 0.20)
    margin_y = int(fh * 0.20)

    x1 = max(0, fx - margin_x)
    y1 = max(0, fy - margin_y)
    x2 = min(w, fx + fw + margin_x)
    y2 = min(h, fy + fh + margin_y)

    cropped = img[y1:y2, x1:x2]
    if cropped.size == 0:
        cropped = img

    # Resize chuẩn về 300x300 nếu quá to để tối ưu dung lượng lưu trữ Cloudinary (~30KB)
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

        DeepFaceModule = get_deepface()
        result = None
        # Thử detector opencv/ssd trước (nhanh, nhẹ cho cloud) rồi đến mtcnn, retinaface
        for detector in ["opencv", "ssd", "mtcnn", "retinaface"]:
            try:
                result = DeepFaceModule.represent(
                    img_path=file_location,
                    model_name="Facenet",
                    detector_backend=detector,
                    enforce_detection=True,
                    align=True
                )
                if result and len(result) > 0:
                    break
            except Exception:
                continue

        if not result or len(result) == 0:
            raise HTTPException(status_code=400, detail="Không tìm thấy khuôn mặt trong ảnh, vui lòng thử lại ảnh rõ nét hơn.")

        best_face = result[0]
        embedding = best_face.get("embedding")
        facial_area = best_face.get("facial_area", {})
        face_confidence = best_face.get("face_confidence", 1.0)

        # Crop riêng khuôn mặt
        cropped_image = crop_face_to_base64(file_location, facial_area)

        if os.path.exists(file_location):
            os.remove(file_location)

        return {
            "embedding": embedding,
            "face_confidence": face_confidence,
            "facial_area": facial_area,
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
