package com.lvtn.chamcong.common.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadFile(MultipartFile file) throws IOException {
        String publicId = UUID.randomUUID().toString();
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("public_id", publicId));
        return uploadResult.get("url").toString();
    }

    public String uploadBase64Image(String base64Image) throws IOException {
        String publicId = UUID.randomUUID().toString();
        Map uploadResult = cloudinary.uploader().upload(base64Image,
                ObjectUtils.asMap("public_id", publicId));
        return uploadResult.get("url").toString();
    }

    /**
     * Xóa file trên Cloudinary khi rollback (ví dụ: upload thành công nhưng lưu DB thất bại).
     * publicId được trích xuất từ URL Cloudinary.
     */
    public void deleteFile(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        try {
            // URL dạng: https://res.cloudinary.com/<cloud>/<type>/<version>/<public_id>.<ext>
            String withoutQuery = imageUrl.split("\\?")[0];
            String fileName = withoutQuery.substring(withoutQuery.lastIndexOf('/') + 1);
            String publicId = fileName.contains(".") ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Đã xóa file Cloudinary orphan: {}", publicId);
        } catch (Exception e) {
            log.warn("Không thể xóa file Cloudinary ({}): {}", imageUrl, e.getMessage());
        }
    }
}
