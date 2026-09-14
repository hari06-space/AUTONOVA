package com.nutech.email.controller;

import com.nutech.email.dto.ReviewDto.*;
import com.nutech.email.service.ReviewQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/review-queue")
@RequiredArgsConstructor
public class ReviewQueueController {

    private final ReviewQueueService reviewQueueService;

    @GetMapping("/pending")
    public ResponseEntity<List<ReviewQueueItemResponse>> getPendingItems() {
        return ResponseEntity.ok(reviewQueueService.getPendingItems());
    }

    @PostMapping("/resolve")
    public ResponseEntity<Void> resolveItem(@RequestBody ResolveRequest request) {
        // No auth — pass 0 as userId
        reviewQueueService.resolveItem(request, 0L);
        return ResponseEntity.ok().build();
    }
}
