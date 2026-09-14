/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: Embedded local Python process execution service for document extraction and indexing.
 */
package com.autonoma.erp.modules.platform.docsearch.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class PythonDocumentProcessingService {

    @Value("${document.search.python.enabled:true}")
    private boolean pythonEnabled;

    @Value("${document.search.python.executable:python}")
    private String pythonExecutable;

    @Value("${document.search.python.script:scripts/doc_indexer.py}")
    private String pythonScript;

    @Value("${document.search.index.path:D:/BOS_DOCUMENTS/.search_index/doc_search.db}")
    private String indexPath;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Resolve Python executable dynamically across Windows, Linux, and PATH.
     */
    private String resolvePythonExecutable() {
        if (pythonExecutable != null && !pythonExecutable.equalsIgnoreCase("python") && !pythonExecutable.equalsIgnoreCase("python3")) {
            File f = new File(pythonExecutable);
            if (f.exists()) {
                return pythonExecutable;
            }
        }

        String target = (pythonExecutable != null && !pythonExecutable.isBlank()) ? pythonExecutable : "python";
        if (canExecute(target)) {
            return target;
        }

        // On Linux / Unix production servers
        if (canExecute("python3")) {
            return "python3";
        }

        // Common Windows fallbacks
        String userHome = System.getProperty("user.home");
        if (userHome != null) {
            String[] winPaths = {
                    userHome + "/AppData/Local/Python/pythoncore-3.14-64/python.exe",
                    userHome + "/AppData/Local/Python/bin/python.exe",
                    userHome + "/AppData/Local/Programs/Python/Python312/python.exe",
                    userHome + "/AppData/Local/Programs/Python/Python311/python.exe",
                    userHome + "/AppData/Local/Programs/Python/Python310/python.exe",
                    "C:/Program Files/PostgreSQL/18/pgAdmin 4/python/python.exe"
            };
            for (String p : winPaths) {
                if (new File(p).exists()) {
                    return p;
                }
            }

            File pyDir = new File(userHome + "/AppData/Local/Python");
            if (pyDir.exists() && pyDir.isDirectory()) {
                File[] sub = pyDir.listFiles((dir, name) -> name.startsWith("pythoncore"));
                if (sub != null) {
                    for (File s : sub) {
                        File exe = new File(s, "python.exe");
                        if (exe.exists()) {
                            return exe.getAbsolutePath();
                        }
                    }
                }
            }
        }
        return target;
    }

    private boolean canExecute(String cmd) {
        try {
            Process p = new ProcessBuilder(cmd, "--version").start();
            return p.waitFor(2, java.util.concurrent.TimeUnit.SECONDS) && p.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Resolve the absolute path to the Python script, supporting development directory and packaged JAR classpath.
     */
    private String resolveScriptPath() {
        File file = new File(pythonScript);
        if (file.exists()) {
            return file.getAbsolutePath();
        }
        File fallback = Paths.get(System.getProperty("user.dir"), pythonScript).toFile();
        if (fallback.exists()) {
            return fallback.getAbsolutePath();
        }

        // Production JAR classpath extraction
        try {
            String resPath = pythonScript.startsWith("/") ? pythonScript : "/" + pythonScript;
            if (resPath.contains("scripts/doc_indexer.py")) {
                resPath = "/scripts/doc_indexer.py";
            }
            java.io.InputStream is = getClass().getResourceAsStream(resPath);
            if (is != null) {
                File tempDir = new File(System.getProperty("java.io.tmpdir"), "bos_scripts");
                if (!tempDir.exists()) {
                    tempDir.mkdirs();
                }
                File tempScript = new File(tempDir, "doc_indexer.py");
                java.nio.file.Files.copy(is, tempScript.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                is.close();
                return tempScript.getAbsolutePath();
            }
        } catch (Exception e) {
            log.warn("Failed to extract python script from classpath: {}", e.getMessage());
        }

        return pythonScript;
    }

    /**
     * Extract and index a physical document using embedded Python.
     */
    public JsonNode extractAndIndex(String absoluteFilePath, String fileHash) {
        if (!pythonEnabled) {
            log.warn("Python document extraction is disabled in configuration.");
            return null;
        }

        List<String> command = new ArrayList<>();
        command.add(resolvePythonExecutable());
        command.add(resolveScriptPath());
        command.add("extract");
        command.add("--file");
        command.add(absoluteFilePath);
        if (fileHash != null && !fileHash.isBlank()) {
            command.add("--hash");
            command.add(fileHash);
        }
        command.add("--db");
        command.add(indexPath);

        return executePythonCommand(command, 120);
    }

    /**
     * Search the local persistent FTS5 index using embedded Python with optional file hash restriction.
     */
    public JsonNode searchIndex(String query, int limit, java.util.Collection<String> allowedHashes) {
        if (!pythonEnabled) {
            log.warn("Python document search is disabled in configuration.");
            return null;
        }

        List<String> command = new ArrayList<>();
        command.add(resolvePythonExecutable());
        command.add(resolveScriptPath());
        command.add("search");
        command.add("--query");
        command.add(query);
        command.add("--db");
        command.add(indexPath);
        command.add("--limit");
        command.add(String.valueOf(limit));

        if (allowedHashes != null && !allowedHashes.isEmpty()) {
            command.add("--hashes");
            command.add(String.join(",", allowedHashes));
        }

        return executePythonCommand(command, 30);
    }

    public JsonNode searchIndex(String query, int limit) {
        return searchIndex(query, limit, null);
    }

    /**
     * Get statistics of the local persistent FTS5 index.
     */
    public JsonNode getIndexStatus() {
        if (!pythonEnabled) {
            return null;
        }

        List<String> command = new ArrayList<>();
        command.add(resolvePythonExecutable());
        command.add(resolveScriptPath());
        command.add("status");
        command.add("--db");
        command.add(indexPath);

        return executePythonCommand(command, 10);
    }

    /**
     * Render high-resolution page preview with visual highlights and bounding boxes.
     */
    public JsonNode renderPagePreview(String absoluteFilePath, int page, String query, boolean highlight) {
        if (!pythonEnabled) {
            return null;
        }

        List<String> command = new ArrayList<>();
        command.add(resolvePythonExecutable());
        command.add(resolveScriptPath());
        command.add("render-preview");
        command.add("--file");
        command.add(absoluteFilePath);
        command.add("--page");
        command.add(String.valueOf(page));
        if (query != null && !query.isBlank()) {
            command.add("--query");
            command.add(query.trim());
        }
        if (highlight) {
            command.add("--highlight");
        }

        return executePythonCommand(command, 25);
    }

    private JsonNode executePythonCommand(List<String> command, int timeoutSeconds) {
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(false);

            Process process = pb.start();

            StringBuilder stdout = new StringBuilder();
            StringBuilder stderr = new StringBuilder();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    stdout.append(line);
                }
            }

            try (BufferedReader errReader = new BufferedReader(new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = errReader.readLine()) != null) {
                    stderr.append(line).append("\n");
                }
            }

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.error("Python command timed out after {} seconds: {}", timeoutSeconds, command);
                return null;
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                log.error("Python command exited with code {}. Stderr: {}", exitCode, stderr);
                return null;
            }

            String outputStr = stdout.toString().trim();
            if (outputStr.isEmpty()) {
                return null;
            }

            return objectMapper.readTree(outputStr);
        } catch (Exception e) {
            log.error("Failed to execute embedded Python command: {}", e.getMessage(), e);
            return null;
        }
    }
}
