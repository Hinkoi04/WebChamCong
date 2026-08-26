package com.lvtn.chamcong;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class ChamCongApplication {

    @PostConstruct
    public void init() {
        // Cố định múi giờ cho toàn bộ hệ thống là giờ Việt Nam (GMT+7)
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
    }

    public static void main(String[] args) {
        SpringApplication.run(ChamCongApplication.class, args);
    }

}
//mvn spring-boot:run
