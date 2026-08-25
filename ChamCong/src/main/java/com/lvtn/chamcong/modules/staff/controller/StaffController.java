package com.lvtn.chamcong.modules.staff.controller;

import com.lvtn.chamcong.modules.staff.dto.FaceDataRequest;
import com.lvtn.chamcong.modules.staff.dto.FaceDataResponse;
import com.lvtn.chamcong.modules.staff.dto.StaffRequest;
import com.lvtn.chamcong.modules.staff.dto.StaffResponse;
import com.lvtn.chamcong.modules.staff.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import java.util.List;

@RestController
@RequestMapping("/api/org/{orgId}/staffs")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @PostMapping
    public ResponseEntity<StaffResponse> createStaff(
            @PathVariable("orgId") Long orgId,
            @Valid @RequestBody StaffRequest request) {
        return ResponseEntity.ok(staffService.createStaff(orgId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StaffResponse> updateStaff(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id,
            @Valid @RequestBody StaffRequest request) {
        return ResponseEntity.ok(staffService.updateStaff(orgId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStaff(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id) {
        staffService.deleteStaff(orgId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffResponse> getStaffById(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(staffService.getStaffById(orgId, id));
    }

    @GetMapping
    public ResponseEntity<List<StaffResponse>> getAllStaff(@PathVariable("orgId") Long orgId) {
        return ResponseEntity.ok(staffService.getAllStaff(orgId));
    }

    @PostMapping("/face")
    public ResponseEntity<FaceDataResponse> registerFace(
            @PathVariable("orgId") Long orgId,
            @Valid @RequestBody FaceDataRequest request) {
        return ResponseEntity.ok(staffService.registerFace(orgId, request));
    }

    @PostMapping("/{id}/face-upload")
    public ResponseEntity<FaceDataResponse> uploadAndRegisterFace(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long staffId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "replace", defaultValue = "false") boolean replace) throws IOException {
        return ResponseEntity.ok(staffService.uploadAndRegisterFace(orgId, staffId, file, replace));
    }

    @GetMapping("/{id}/faces")
    public ResponseEntity<List<FaceDataResponse>> getFaceDataList(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(staffService.getFaceDataList(orgId, id));
    }

    // Trash Endpoints
    @GetMapping("/trash")
    public ResponseEntity<List<StaffResponse>> getTrashStaff(@PathVariable("orgId") Long orgId) {
        return ResponseEntity.ok(staffService.getTrashStaff(orgId));
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<StaffResponse> restoreStaff(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(staffService.restoreStaff(orgId, id));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> permanentDeleteStaff(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id) {
        staffService.permanentDeleteStaff(orgId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/trash/restore-all")
    public ResponseEntity<Void> restoreAllTrash(@PathVariable("orgId") Long orgId) {
        staffService.restoreAllTrash(orgId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/trash/empty")
    public ResponseEntity<Void> emptyTrash(@PathVariable("orgId") Long orgId) {
        staffService.emptyTrash(orgId);
        return ResponseEntity.noContent().build();
    }
}
