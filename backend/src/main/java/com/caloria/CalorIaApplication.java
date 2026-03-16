package com.caloria;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class CalorIaApplication {
    public static void main(String[] args) {
        SpringApplication.run(CalorIaApplication.class, args);
    }
}
