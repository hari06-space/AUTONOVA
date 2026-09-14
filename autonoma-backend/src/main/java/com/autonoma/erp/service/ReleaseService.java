package com.autonoma.erp.service;

import com.autonoma.erp.model.ReleaseMaster;
import com.autonoma.erp.model.ReleaseDetail;
import com.autonoma.erp.model.UserReleaseRead;
import com.autonoma.erp.repository.ReleaseMasterRepository;
import com.autonoma.erp.repository.ReleaseDetailRepository;
import com.autonoma.erp.repository.UserReleaseReadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReleaseService {

    @Autowired
    private ReleaseMasterRepository releaseMasterRepository;

    @Autowired
    private ReleaseDetailRepository releaseDetailRepository;

    @Autowired
    private UserReleaseReadRepository userReleaseReadRepository;

    public List<ReleaseMaster> getAllReleases() {
        return releaseMasterRepository.findAll();
    }

    public List<ReleaseMaster> getActiveReleases() {
        return releaseMasterRepository.findByIsActiveOrderByReleaseDateDesc(true);
    }

    public Optional<ReleaseMaster> getReleaseById(Long id) {
        return releaseMasterRepository.findById(id);
    }

    @Transactional
    public ReleaseMaster saveRelease(ReleaseMaster release) {
        if (release.getDetails() != null) {
            for (ReleaseDetail detail : release.getDetails()) {
                detail.setReleaseMaster(release);
            }
        }
        return releaseMasterRepository.save(release);
    }

    @Transactional
    public void deleteRelease(Long id) {
        releaseMasterRepository.deleteById(id);
    }

    @Transactional
    public void resetReadRecords(Long releaseId) {
        List<UserReleaseRead> reads = userReleaseReadRepository.findAll().stream()
                .filter(r -> r.getReleaseId().equals(releaseId))
                .collect(Collectors.toList());
        userReleaseReadRepository.deleteAll(reads);
    }

    public Optional<ReleaseMaster> checkLatestUnreadRelease(String userId) {
        List<ReleaseMaster> activeReleases = releaseMasterRepository.findLatestActiveRelease();
        if (activeReleases.isEmpty()) {
            return Optional.empty();
        }

        // Get the latest active release
        ReleaseMaster latest = activeReleases.get(0);

        // Check if the user has read it
        List<UserReleaseRead> userReads = userReleaseReadRepository.findByUserId(userId);
        boolean hasRead = userReads.stream()
                .anyMatch(r -> r.getReleaseId().equals(latest.getId()) && (r.getDontShowAgain() || r.getReadDate() != null));

        if (!hasRead) {
            return Optional.of(latest);
        }

        return Optional.empty();
    }

    @Transactional
    public UserReleaseRead acknowledgeRelease(String userId, Long releaseId, Boolean dontShowAgain) {
        UserReleaseRead read = new UserReleaseRead();
        read.setUserId(userId);
        read.setReleaseId(releaseId);
        read.setReadDate(new Date());
        read.setDontShowAgain(dontShowAgain != null ? dontShowAgain : false);
        return userReleaseReadRepository.save(read);
    }

    public List<ReleaseDetail> suggestReleaseDetails(String sinceStr) {
        List<ReleaseDetail> suggestions = new java.util.ArrayList<>();
        try {
            String sinceArg = null;
            if (sinceStr != null && !sinceStr.trim().isEmpty()) {
                sinceArg = sinceStr;
            } else {
                List<ReleaseMaster> activeReleases = releaseMasterRepository.findLatestActiveRelease();
                if (!activeReleases.isEmpty()) {
                    Date latestDate = activeReleases.get(0).getReleaseDate();
                    sinceArg = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(latestDate);
                }
            }

            List<String> command = new java.util.ArrayList<>();
            command.add("git");
            command.add("log");
            if (sinceArg != null) {
                command.add("--since=" + sinceArg);
            } else {
                command.add("-n");
                command.add("50");
            }
            command.add("--pretty=format:%h|%an|%ad|%s");

            ProcessBuilder pb = new ProcessBuilder(command);
            java.io.File currentDir = new java.io.File(System.getProperty("user.dir"));
            java.io.File gitDir = currentDir;
            if (!new java.io.File(gitDir, ".git").exists() && gitDir.getParentFile() != null) {
                gitDir = gitDir.getParentFile();
            }
            pb.directory(gitDir);

            Process process = pb.start();
            java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(process.getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
            String line;
            int displayOrder = 1;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split("\\|", 4);
                if (parts.length >= 4) {
                    String hash = parts[0];
                    String author = parts[1];
                    String date = parts[2];
                    String subject = parts[3];

                    if (subject.startsWith("Merge pull request") || subject.startsWith("Merge branch") || subject.startsWith("Merge remote-tracking branch")) {
                        continue;
                    }

                    ReleaseDetail detail = new ReleaseDetail();
                    detail.setDisplayOrder(displayOrder++);

                    parseCommit(subject, detail);

                    detail.setDescription("Suggested from commit " + hash + " by " + author + " (" + date + ")");
                    suggestions.add(detail);
                }
            }
            process.waitFor();
        } catch (Exception e) {
            System.err.println("Failed to get git suggestions: " + e.getMessage());
        }
        return suggestions;
    }

    private void parseCommit(String subject, ReleaseDetail detail) {
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^(\\w+)(?:\\(([^)]+)\\))?:\\s*(.*)$");
        java.util.regex.Matcher matcher = pattern.matcher(subject);
        if (matcher.matches()) {
            String type = matcher.group(1).toLowerCase();
            String scope = matcher.group(2) != null ? matcher.group(2).toLowerCase() : "";
            String msg = matcher.group(3);

            String cleanTitle = capitalize(msg);
            detail.setTitle(cleanTitle);

            String category = "Enhancements";
            if (type.equals("feat") || type.equals("feature")) {
                category = "New Features";
            } else if (type.equals("fix") || type.equals("bug")) {
                category = "Bug Fixes";
            } else if (type.equals("perf")) {
                category = "Performance";
            } else if (type.equals("style")) {
                category = "UI/UX";
            }

            if (scope.equals("db") || scope.equals("sql") || scope.equals("migration") || msg.toLowerCase().contains("database") || msg.toLowerCase().contains("sql")) {
                category = "Database";
            } else if (scope.equals("ui") || scope.equals("ux") || scope.equals("frontend") || msg.toLowerCase().contains("ui/") || msg.toLowerCase().contains("layout") || msg.toLowerCase().contains("css")) {
                category = "UI/UX";
            } else if (msg.toLowerCase().contains("security") || msg.toLowerCase().contains("auth") || msg.toLowerCase().contains("login")) {
                category = "Security";
            } else if (msg.toLowerCase().contains("deprecate")) {
                category = "Deprecated";
            }

            detail.setCategory(category);
        } else {
            detail.setTitle(capitalize(subject));
            String subLower = subject.toLowerCase();
            String category = "Enhancements";

            if (subLower.contains("fix") || subLower.contains("bug") || subLower.contains("error") || subLower.contains("issue") || subLower.contains("crash") || subLower.contains("heal")) {
                category = "Bug Fixes";
            } else if (subLower.contains("feat") || subLower.contains("add") || subLower.contains("implement") || subLower.contains("new") || subLower.contains("create")) {
                category = "New Features";
            } else if (subLower.contains("perf") || subLower.contains("speed") || subLower.contains("optimize")) {
                category = "Performance";
            } else if (subLower.contains("ui") || subLower.contains("ux") || subLower.contains("style") || subLower.contains("css") || subLower.contains("theme") || subLower.contains("design") || subLower.contains("view")) {
                category = "UI/UX";
            } else if (subLower.contains("secure") || subLower.contains("auth") || subLower.contains("login") || subLower.contains("encrypt")) {
                category = "Security";
            } else if (subLower.contains("db") || subLower.contains("sql") || subLower.contains("migration") || subLower.contains("table")) {
                category = "Database";
            } else if (subLower.contains("deprecate")) {
                category = "Deprecated";
            }

            detail.setCategory(category);
        }
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return "";
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
