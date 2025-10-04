//
//  IssueSubmissionViewModel.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import Foundation
import UIKit

@MainActor
class IssueSubmissionViewModel: ObservableObject {
    @Published var capturedImage: UIImage?
    @Published var aiDescription: String = ""
    @Published var userEditedDescription: String = ""
    @Published var location: String = ""
    @Published var timestamp: Date = Date()

    @Published var isAnalyzing: Bool = false
    @Published var isSubmitting: Bool = false
    @Published var error: String?
    @Published var successMessage: String?

    private let networkService = NetworkService.shared
    private let locationService = LocationService()
    private let authService = AuthService.shared

    func captureImageData(image: UIImage) async {
        print("📸 [DEBUG] captureImageData started")
        self.capturedImage = image
        self.timestamp = Date()

        // Get location (has built-in fallback, never throws)
        print("📍 [DEBUG] Getting location...")
        do {
            self.location = try await locationService.getCurrentLocation()
            print("📍 [DEBUG] Location obtained: \(location)")
        } catch {
            // This should never happen since LocationService has fallback
            print("❌ [DEBUG] Unexpected location error: \(error)")
            self.location = "40.4406,-79.9959"
        }

        // Start AI analysis
        print("🤖 [DEBUG] Starting AI analysis...")
        await analyzeImage()
    }

    func analyzeImage() async {
        print("🤖 [DEBUG] analyzeImage called")
        guard let image = capturedImage,
              let authToken = authService.getAuthToken() else {
            print("❌ [DEBUG] Missing image or auth token")
            error = "Missing image or authentication"
            return
        }

        print("✅ [DEBUG] Image and token present, calling backend...")
        isAnalyzing = true
        error = nil

        do {
            let description = try await networkService.analyzeImage(
                image: image,
                location: location,
                timestamp: timestamp,
                authToken: authToken
            )
            print("✅ [DEBUG] Got AI description: \(description)")
            self.aiDescription = description
            self.userEditedDescription = description
        } catch let error as NSError {
            print("❌ [DEBUG] Network error: \(error.code) - \(error.localizedDescription)")
            if error.code == -1001 || error.code == -1004 {
                self.error = "⚠️ Backend server not running. Please start the backend at http://172.26.24.39:8000"
            } else {
                self.error = "Failed to analyze image: \(error.localizedDescription)"
            }
        }

        isAnalyzing = false
        print("🤖 [DEBUG] analyzeImage finished, isAnalyzing=false")
    }

    func submitIssue() async {
        guard let image = capturedImage,
              let authToken = authService.getAuthToken() else {
            error = "Missing image or authentication"
            return
        }

        isSubmitting = true
        error = nil

        do {
            let issue = try await networkService.submitIssue(
                image: image,
                description: userEditedDescription,
                location: location,
                timestamp: timestamp,
                authToken: authToken
            )
            successMessage = "Issue submitted successfully!"
            print("Issue created with ID: \(issue.id)")
        } catch {
            self.error = "Failed to submit issue: \(error.localizedDescription)"
        }

        isSubmitting = false
    }

    func reset() {
        capturedImage = nil
        aiDescription = ""
        userEditedDescription = ""
        location = ""
        timestamp = Date()
        error = nil
        successMessage = nil
    }
}
