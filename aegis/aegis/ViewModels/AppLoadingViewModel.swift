//
//  AppLoadingViewModel.swift
//  aegis
//
//  Manages app loading state - tracks when Discover and Reviews are ready
//

import Foundation
import SwiftUI

@MainActor
class AppLoadingViewModel: ObservableObject {
    @Published var isLoading = true
    @Published var discoverLoaded = false
    @Published var reviewsLoaded = false
    
    // Minimum loading time for branding (1.0 seconds - enough to show logo and start loading)
    private let minimumLoadingTime: TimeInterval = 1.0
    private var loadingStartTime: Date?
    
    // Maximum loading time before forcing complete (60 seconds - enough for LLM)
    private let maximumLoadingTime: TimeInterval = 80.0
    
    var allLoaded: Bool {
        discoverLoaded && reviewsLoaded
    }
    
    init() {
        loadingStartTime = Date()
        print("🔄 [LOADING] AppLoadingViewModel initialized")
        
        // Safety timeout: Force complete after maximum time
        Task {
            try? await Task.sleep(nanoseconds: UInt64(maximumLoadingTime * 1_000_000_000))
            await MainActor.run {
                if isLoading {
                    print("⏰ [LOADING] Maximum time reached, forcing complete")
                    forceComplete()
                }
            }
        }
    }
    
    func markDiscoverLoaded() {
        guard !discoverLoaded else { return }
        discoverLoaded = true
        print("✅ [LOADING] Discover loaded")
        checkCompletion()
    }
    
    func markReviewsLoaded() {
        guard !reviewsLoaded else { return }
        reviewsLoaded = true
        print("✅ [LOADING] Reviews loaded")
        checkCompletion()
    }
    
    private func checkCompletion() {
        guard allLoaded else { return }
        
        // Calculate remaining time to meet minimum loading duration
        let elapsedTime = Date().timeIntervalSince(loadingStartTime ?? Date())
        let remainingTime = max(0, minimumLoadingTime - elapsedTime)
        
        print("⏱️ [LOADING] All content loaded. Elapsed: \(String(format: "%.1f", elapsedTime))s, Remaining: \(String(format: "%.1f", remainingTime))s")
        
        // Ensure minimum loading time for branding
        DispatchQueue.main.asyncAfter(deadline: .now() + remainingTime) {
            withAnimation(.easeOut(duration: 0.4)) {
                self.isLoading = false
                print("🎉 [LOADING] Loading complete! Showing app.")
            }
        }
    }
    
    // For debugging: Force complete loading
    func forceComplete() {
        print("⚠️ [LOADING] Force completing loading")
        discoverLoaded = true
        reviewsLoaded = true
        checkCompletion()
    }
}
