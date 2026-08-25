package com.lvtn.chamcong.modules.position.controller;

import com.lvtn.chamcong.modules.position.dto.PositionRequest;
import com.lvtn.chamcong.modules.position.dto.PositionResponse;
import com.lvtn.chamcong.modules.position.service.PositionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org/{orgId}/positions")
@RequiredArgsConstructor
public class PositionController {

    private final PositionService positionService;

    @PostMapping
    public ResponseEntity<PositionResponse> createPosition(
            @PathVariable("orgId") Long orgId,
            @Valid @RequestBody PositionRequest request) {
        return ResponseEntity.ok(positionService.createPosition(orgId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PositionResponse> updatePosition(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id,
            @Valid @RequestBody PositionRequest request) {
        return ResponseEntity.ok(positionService.updatePosition(orgId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePosition(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id) {
        positionService.deletePosition(orgId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PositionResponse> getPositionById(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(positionService.getPositionById(orgId, id));
    }

    @GetMapping
    public ResponseEntity<List<PositionResponse>> getAllPositions(@PathVariable("orgId") Long orgId) {
        return ResponseEntity.ok(positionService.getAllPositions(orgId));
    }
}
