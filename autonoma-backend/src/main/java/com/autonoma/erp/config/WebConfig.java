package com.autonoma.erp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.TimeUnit;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AuditContextInterceptor auditContextInterceptor;
    private final MigrationContextInterceptor migrationContextInterceptor;

    public WebConfig(AuditContextInterceptor auditContextInterceptor, MigrationContextInterceptor migrationContextInterceptor) {
        this.auditContextInterceptor = auditContextInterceptor;
        this.migrationContextInterceptor = migrationContextInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(auditContextInterceptor)
                .addPathPatterns("/**"); // Apply to all paths

        registry.addInterceptor(migrationContextInterceptor)
                .addPathPatterns("/api/admin/migration/**");
    }

    /**
     * Cache-control strategy:
     *  - /assets/** (hashed filenames) → cache 1 year (immutable)
     *  - Everything else (index.html, manifest.json) → no-cache so browsers
     *    always re-validate after a new deployment, preventing MIME-type crashes.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Hashed JS/CSS/font assets — safe to cache long-term (filename changes on rebuild)
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable());

        // Everything else (index.html, logo, manifest) — never cache
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noStore());
    }

    @Override
    public void extendMessageConverters(java.util.List<org.springframework.http.converter.HttpMessageConverter<?>> converters) {
        for (org.springframework.http.converter.HttpMessageConverter<?> converter : converters) {
            if (converter instanceof org.springframework.http.converter.json.MappingJackson2HttpMessageConverter) {
                org.springframework.http.converter.json.MappingJackson2HttpMessageConverter jacksonConverter =
                        (org.springframework.http.converter.json.MappingJackson2HttpMessageConverter) converter;
                java.util.List<org.springframework.http.MediaType> mediaTypes = new java.util.ArrayList<>(jacksonConverter.getSupportedMediaTypes());
                mediaTypes.add(org.springframework.http.MediaType.parseMediaType("application/json;charset=UTF-8"));
                mediaTypes.add(org.springframework.http.MediaType.ALL);
                jacksonConverter.setSupportedMediaTypes(mediaTypes);
            }
        }
    }

    @Bean
    public StandardServletMultipartResolver multipartResolver() {
        StandardServletMultipartResolver resolver = new StandardServletMultipartResolver();
        resolver.setStrictServletCompliance(false);
        return resolver;
    }
}
