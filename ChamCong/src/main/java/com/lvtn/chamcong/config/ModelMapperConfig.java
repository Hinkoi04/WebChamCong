package com.lvtn.chamcong.config;

import com.lvtn.chamcong.modules.attendance.dto.AttendanceResponse;
import com.lvtn.chamcong.modules.attendance.entity.Attendance;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ModelMapperConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setSkipNullEnabled(true);

        // BUG-010 fix: Map Attendance.staff.id → AttendanceResponse.staffId
        // ModelMapper STRICT không tự map nested field staff.id → staffId
        modelMapper.createTypeMap(Attendance.class, AttendanceResponse.class)
                .addMappings(mapper -> mapper.map(
                        src -> src.getStaff().getId(),
                        AttendanceResponse::setStaffId
                ));

        return modelMapper;
    }
}
