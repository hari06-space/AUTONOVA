package com.autonoma.erp.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class JpaDependencyConfig {

    @Bean
    public static BeanFactoryPostProcessor jpaDependencyPostProcessor() {
        return beanFactory -> {
            String[] entityManagerFactoryNames = beanFactory.getBeanNamesForType(EntityManagerFactory.class, true, false);
            for (String name : entityManagerFactoryNames) {
                BeanDefinition bd = beanFactory.getBeanDefinition(name);
                String[] dependsOn = bd.getDependsOn();
                if (dependsOn == null) {
                    bd.setDependsOn("sqlMigrationRunner");
                } else {
                    List<String> list = new ArrayList<>(Arrays.asList(dependsOn));
                    if (!list.contains("sqlMigrationRunner")) {
                        list.add("sqlMigrationRunner");
                        bd.setDependsOn(list.toArray(new String[0]));
                    }
                }
            }
        };
    }
}
