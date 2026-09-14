package com.autonoma.erp.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class WebController {

    @RequestMapping(value = {
        "/{path:^(?!api|error|swagger-ui|v3)[^\\.]*}",
        "/{path1:^(?!api|error|swagger-ui|v3)[^\\.]*}/{path2:[^\\.]*}",
        "/{path1:^(?!api|error|swagger-ui|v3)[^\\.]*}/{path2:[^\\.]*}/{path3:[^\\.]*}"
    })
    public String redirect() {
        return "forward:/index.html";
    }
}

