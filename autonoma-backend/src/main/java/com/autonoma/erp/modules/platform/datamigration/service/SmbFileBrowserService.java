package com.autonoma.erp.modules.platform.datamigration.service;

import jcifs.CIFSContext;
import jcifs.context.SingletonContext;
import jcifs.smb.NtlmPasswordAuthenticator;
import jcifs.smb.SmbFile;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SmbFileBrowserService {

    public List<String> browseDirectories(String ip, String username, String password, String path) {
        List<String> directories = new ArrayList<>();
        
        try {
            // Setup credentials and short timeouts
            java.util.Properties prop = new java.util.Properties();
            prop.setProperty("jcifs.smb.client.connTimeout", "3000");
            prop.setProperty("jcifs.smb.client.responseTimeout", "3000");
            prop.setProperty("jcifs.smb.client.soTimeout", "3000");
            jcifs.config.PropertyConfiguration config = new jcifs.config.PropertyConfiguration(prop);
            
            jcifs.context.BaseContext bc = new jcifs.context.BaseContext(config);
            NtlmPasswordAuthenticator auth = new NtlmPasswordAuthenticator(null, username, password);
            CIFSContext context = bc.withCredentials(auth);

            // Construct SMB URL
            String smbUrl = "smb://" + ip + "/";
            if (path != null && !path.trim().isEmpty()) {
                String cleanPath = path.replace("\\", "/");
                if (cleanPath.startsWith("/")) {
                    cleanPath = cleanPath.substring(1);
                }
                smbUrl += cleanPath;
                if (!smbUrl.endsWith("/")) {
                    smbUrl += "/";
                }
            }

            SmbFile root = new SmbFile(smbUrl, context);
            
            // List directories
            SmbFile[] files = root.listFiles();
            if (files != null) {
                for (SmbFile f : files) {
                    if (f.isDirectory()) {
                        String name = f.getName();
                        if (name.endsWith("/")) {
                            name = name.substring(0, name.length() - 1);
                        }
                        if (!name.isEmpty() && !name.equals(".") && !name.equals("..")) {
                            directories.add(name);
                        }
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to browse SMB directory: " + e.getMessage(), e);
        }
        
        return directories;
    }
}
