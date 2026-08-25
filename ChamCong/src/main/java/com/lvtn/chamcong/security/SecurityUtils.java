package com.lvtn.chamcong.security;

import com.lvtn.chamcong.common.exception.ForbiddenException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Lấy UserPrincipal hiện tại từ SecurityContext
     */
    public static UserPrincipal getCurrentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) authentication.getPrincipal();
        }
        return null;
    }

    /**
     * Lấy ID của người dùng / admin hiện tại
     */
    public static Long getCurrentUserId() {
        UserPrincipal principal = getCurrentPrincipal();
        return principal != null ? principal.getId() : null;
    }

    /**
     * Kiểm tra quyền sở hữu Tenant (Multi-tenant isolation).
     * Nếu là ADMIN: cho phép truy cập tất cả.
     * Nếu là USER (Organization): chỉ được phép truy cập orgId của chính mình.
     */
    public static void validateTenantAccess(Long requestedOrgId) {
        UserPrincipal principal = getCurrentPrincipal();
        if (principal == null) {
            throw new ForbiddenException("Không tìm thấy thông tin xác thực");
        }

        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isAdmin) {
            if (requestedOrgId == null || !requestedOrgId.equals(principal.getId())) {
                throw new ForbiddenException("Truy cập trái phép: Bạn không có quyền thao tác trên dữ liệu của tổ chức khác");
            }
        }
    }
}
