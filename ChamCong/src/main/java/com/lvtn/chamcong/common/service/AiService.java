package com.lvtn.chamcong.common.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.multipart.MultipartFile;
import com.lvtn.chamcong.common.exception.BadRequestException;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.service-url}")
    private String aiServiceUrl;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AiFaceResult {
        private String embeddingJson;
        private String croppedImageBase64;
        private Double confidence;
    }

    public String extractFaceEmbedding(MultipartFile file) throws IOException {
        AiFaceResult res = extractFaceDetail(file);
        return res.getEmbeddingJson();
    }

    public AiFaceResult extractFaceDetail(MultipartFile file) throws IOException {
        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "face.jpg";
            }
        };
        return callExtractEndpointDetail(resource);
    }

    public String extractFaceEmbeddingBase64(String base64Image) throws IOException {
        AiFaceResult res = extractFaceDetailBase64(base64Image);
        return res.getEmbeddingJson();
    }

    public AiFaceResult extractFaceDetailBase64(String base64Image) throws IOException {
        String base64Data = base64Image.contains(",") ? base64Image.split(",")[1] : base64Image;
        byte[] imageBytes = Base64.getDecoder().decode(base64Data);

        ByteArrayResource resource = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return "checkin.jpg";
            }
        };
        return callExtractEndpointDetail(resource);
    }

    /**
     * Gọi endpoint /extract của Python AI service.
     * Trả về cả embedding vector và cropped_image nếu có.
     */
    private AiFaceResult callExtractEndpointDetail(ByteArrayResource resource) throws IOException {
        String url = aiServiceUrl + "/extract";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", resource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode embeddingNode = root.get("embedding");
                if (embeddingNode != null) {
                    String embeddingJson = objectMapper.writeValueAsString(embeddingNode);
                    String croppedImage = root.has("cropped_image") && !root.get("cropped_image").isNull()
                            ? root.get("cropped_image").asText()
                            : null;
                    Double confidence = root.has("face_confidence") ? root.get("face_confidence").asDouble() : 1.0;

                    return AiFaceResult.builder()
                            .embeddingJson(embeddingJson)
                            .croppedImageBase64(croppedImage)
                            .confidence(confidence)
                            .build();
                }
            }
            throw new RuntimeException("Failed to extract face embedding, no embedding in response.");
        } catch (HttpClientErrorException e) {
            log.error("AI Service returned HTTP Error: ", e);
            try {
                JsonNode root = objectMapper.readTree(e.getResponseBodyAsString());
                if (root.has("detail")) {
                    throw new BadRequestException(root.get("detail").asText());
                }
            } catch (Exception parseException) {
                if (parseException instanceof BadRequestException) throw (BadRequestException) parseException;
            }
            throw new BadRequestException("Lỗi khi xử lý hình ảnh khuôn mặt từ AI Service.");
        } catch (Exception e) {
            log.error("Error calling Python AI service: ", e);
            if (e instanceof BadRequestException) throw (BadRequestException) e;
            throw new RuntimeException("Error communicating with AI Service: " + e.getMessage());
        }
    }

    public double calculateCosineSimilarity(List<Double> vectorA, List<Double> vectorB) {
        if (vectorA.size() != vectorB.size() || vectorA.isEmpty()) {
            return 0.0;
        }
        
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        
        for (int i = 0; i < vectorA.size(); i++) {
            dotProduct += vectorA.get(i) * vectorB.get(i);
            normA += Math.pow(vectorA.get(i), 2);
            normB += Math.pow(vectorB.get(i), 2);
        }
        
        if (normA == 0.0 || normB == 0.0) return 0.0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
