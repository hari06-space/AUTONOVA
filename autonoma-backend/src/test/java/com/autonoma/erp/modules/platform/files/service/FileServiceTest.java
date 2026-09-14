package com.autonoma.erp.modules.platform.files.service;

import com.autonoma.erp.modules.platform.files.entity.FileAttachmentMetadata;
import com.autonoma.erp.modules.platform.files.repository.FileAttachmentMetadataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FileServiceTest {

    @Mock
    private FileAttachmentMetadataRepository metadataRepo;

    @InjectMocks
    private FileService fileService;

    @Test
    public void testGetOriginalFileName_FromMetadata() {
        String storagePath = "MASTER/HR/ATS/InductionCriteria/550e8400-e29b-41d4-a716-446655440000_eashwar.docx";
        FileAttachmentMetadata meta = FileAttachmentMetadata.builder()
                .storagePath(storagePath)
                .originalFileName("eashwar.docx")
                .activeStatus(true)
                .build();

        when(metadataRepo.findByStoragePath(storagePath)).thenReturn(Optional.of(meta));

        String result = fileService.getOriginalFileName(storagePath);
        assertEquals("eashwar.docx", result, "File name should match the recorded original filename from metadata repository");
    }

    @Test
    public void testGetOriginalFileName_LegacyFallbackWithUuidPrefix() {
        String storagePath = "MASTER/HR/ATS/InductionCriteria/550e8400-e29b-41d4-a716-446655440000_eashwar.docx";
        when(metadataRepo.findByStoragePath(storagePath)).thenReturn(Optional.empty());

        String result = fileService.getOriginalFileName(storagePath);
        assertEquals("eashwar.docx", result, "Legacy fallback should strip 36-char UUID prefix and underscore");
    }

    @Test
    public void testGetOriginalFileName_WithoutUuidPrefix() {
        String storagePath = "MASTER/HR/ATS/InductionCriteria/regular_file.pdf";
        when(metadataRepo.findByStoragePath(storagePath)).thenReturn(Optional.empty());

        String result = fileService.getOriginalFileName(storagePath);
        assertEquals("regular_file.pdf", result, "Filename without UUID prefix should remain unchanged");
    }
}
