package com.lvtn.chamcong.common.service;

import com.lvtn.chamcong.modules.attendance.dto.AttendanceResponse;
import com.lvtn.chamcong.modules.salary.dto.SalaryResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExcelExportService {

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

    public byte[] exportAttendanceToExcel(List<AttendanceResponse> attendances, LocalDate startDate, LocalDate endDate) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Bảng Chấm Công");

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            XSSFFont headerFont = ((XSSFWorkbook) workbook).createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Data Style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Title row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(String.format("BẢNG CHẤM CÔNG CHI TIẾT (%s - %s)",
                    startDate != null ? startDate.format(dateFormatter) : "Tất cả",
                    endDate != null ? endDate.format(dateFormatter) : "Tất cả"));
            CellStyle titleStyle = workbook.createCellStyle();
            XSSFFont titleFont = ((XSSFWorkbook) workbook).createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            // Headers
            String[] headers = {"STT", "Mã NV", "Họ & Tên", "Ngày làm việc", "Giờ vào (Check-in)", "Giờ ra (Check-out)", "Hình thức", "Trạng thái", "Ghi chú"};
            Row headerRow = sheet.createRow(2);
            headerRow.setHeightInPoints(26);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 3;
            int stt = 1;
            for (AttendanceResponse att : attendances) {
                Row row = sheet.createRow(rowIdx++);

                Cell c0 = row.createCell(0); c0.setCellValue(stt++); c0.setCellStyle(dataStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(att.getStaffCode() != null ? att.getStaffCode() : ""); c1.setCellStyle(dataStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(att.getStaffName() != null ? att.getStaffName() : ""); c2.setCellStyle(dataStyle);
                Cell c3 = row.createCell(3); c3.setCellValue(att.getWorkDate() != null ? att.getWorkDate().format(dateFormatter) : ""); c3.setCellStyle(dataStyle);
                Cell c4 = row.createCell(4); c4.setCellValue(att.getCheckInTime() != null ? att.getCheckInTime().format(timeFormatter) : "--:--"); c4.setCellStyle(dataStyle);
                Cell c5 = row.createCell(5); c5.setCellValue(att.getCheckOutTime() != null ? att.getCheckOutTime().format(timeFormatter) : "--:--"); c5.setCellStyle(dataStyle);
                Cell c6 = row.createCell(6); c6.setCellValue(att.getCheckInMethod() != null ? att.getCheckInMethod().name() : ""); c6.setCellStyle(dataStyle);
                Cell c7 = row.createCell(7); c7.setCellValue(att.getStatus() != null ? att.getStatus().name() : ""); c7.setCellStyle(dataStyle);
                Cell c8 = row.createCell(8); c8.setCellValue(att.getNote() != null ? att.getNote() : ""); c8.setCellStyle(dataStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportSalaryToExcel(List<SalaryResponse> salaries, int month, int year) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Bảng Lương");

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            XSSFFont headerFont = ((XSSFWorkbook) workbook).createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.SEA_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Data Style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Money Style
            CellStyle moneyStyle = workbook.createCellStyle();
            moneyStyle.cloneStyleFrom(dataStyle);
            DataFormat format = workbook.createDataFormat();
            moneyStyle.setDataFormat(format.getFormat("#,##0"));

            // Title row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(String.format("BẢNG TÍNH LƯƠNG THÁNG %02d/%d", month, year));
            CellStyle titleStyle = workbook.createCellStyle();
            XSSFFont titleFont = ((XSSFWorkbook) workbook).createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            // Headers
            String[] headers = {"STT", "Mã NV", "Họ & Tên", "Lương cơ bản", "Ngày chuẩn", "Ngày làm thực", "Thưởng", "Khấu trừ", "Thực lĩnh (VND)", "Trạng thái"};
            Row headerRow = sheet.createRow(2);
            headerRow.setHeightInPoints(26);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 3;
            int stt = 1;
            for (SalaryResponse sal : salaries) {
                Row row = sheet.createRow(rowIdx++);

                Cell c0 = row.createCell(0); c0.setCellValue(stt++); c0.setCellStyle(dataStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(sal.getStaffCode() != null ? sal.getStaffCode() : ""); c1.setCellStyle(dataStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(sal.getStaffName() != null ? sal.getStaffName() : ""); c2.setCellStyle(dataStyle);

                Cell c3 = row.createCell(3);
                c3.setCellValue(sal.getBaseSalary() != null ? sal.getBaseSalary().doubleValue() : 0);
                c3.setCellStyle(moneyStyle);

                Cell c4 = row.createCell(4); c4.setCellValue(sal.getStandardDays() != null ? sal.getStandardDays() : 26); c4.setCellStyle(dataStyle);
                Cell c5 = row.createCell(5); c5.setCellValue(sal.getWorkingDays() != null ? sal.getWorkingDays() : 0); c5.setCellStyle(dataStyle);

                Cell c6 = row.createCell(6);
                c6.setCellValue(sal.getBonus() != null ? sal.getBonus().doubleValue() : 0);
                c6.setCellStyle(moneyStyle);

                Cell c7 = row.createCell(7);
                c7.setCellValue(sal.getDeduction() != null ? sal.getDeduction().doubleValue() : 0);
                c7.setCellStyle(moneyStyle);

                Cell c8 = row.createCell(8);
                c8.setCellValue(sal.getTotalSalary() != null ? sal.getTotalSalary().doubleValue() : 0);
                c8.setCellStyle(moneyStyle);

                Cell c9 = row.createCell(9); c9.setCellValue(sal.getStatus() != null ? sal.getStatus().name() : ""); c9.setCellStyle(dataStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
