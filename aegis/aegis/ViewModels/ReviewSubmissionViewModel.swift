//
//  ReviewSubmissionViewModel.swift
//  aegis
//
//  ViewModel for food review submission
//

import Foundation
import UIKit

@MainActor
class ReviewSubmissionViewModel: ObservableObject {
    // Image and metadata
    @Published var capturedImage: UIImage?
    @Published var location: String = ""
    @Published var timestamp: Date = Date()
    
    // Backend image record
    @Published var imageId: Int?  // Returned from image upload
    @Published var imageURL: String?
    
    // Food review specific fields (user fills these)
    @Published var restaurantName: String = ""
    @Published var rating: Int = 0
    @Published var userReview: String = ""
    @Published var dish: String = ""  // AI-generated, but user can edit
    @Published var cuisine: String = ""  // AI-generated, but user can edit

    // UI State
    @Published var isUploading: Bool = false  // Uploading image + AI analysis
    @Published var isSubmitting: Bool = false  // Submitting review
    @Published var error: String?
    @Published var successMessage: String?

    private let networkService = NetworkService.shared
    private let locationService = LocationService.shared
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

        // Upload image immediately (AI analyzes in background)
        print("🍽️ [DEBUG] Uploading image to backend...")
        await uploadImage()
    }

    func uploadImage() async {
        print("🍽️ [DEBUG] uploadImage called")
        guard let image = capturedImage,
              let authToken = authService.getAuthToken() else {
            print("❌ [DEBUG] Missing image or auth token")
            error = "Missing image or authentication"
            return
        }

        print("✅ [DEBUG] Image and token present, uploading...")
        isUploading = true
        error = nil

        do {
            // Parse coordinates from location string for restaurant matching
            var latitude: Double?
            var longitude: Double?
            let coords = location.split(separator: ",")
            if coords.count == 2 {
                latitude = Double(coords[0].trimmingCharacters(in: .whitespaces))
                longitude = Double(coords[1].trimmingCharacters(in: .whitespaces))
            }
            
            let uploadResponse = try await networkService.uploadImage(
                image: image,
                location: location,
                timestamp: timestamp,
                latitude: latitude,
                longitude: longitude,
                authToken: authToken
            )
            print("✅ [DEBUG] Image uploaded! ID: \(uploadResponse.imageId)")
            self.imageId = uploadResponse.imageId
            self.imageURL = uploadResponse.imageURL
            
            // Start polling for AI analysis immediately after upload
            Task {
                await startAIPolling()
            }
        } catch let error as NSError {
            print("❌ [DEBUG] Network error: \(error.code) - \(error.localizedDescription)")
            if error.code == -1001 || error.code == -1004 {
                self.error = "⚠️ Backend server not running. Please start the backend at http://172.26.24.39:8000"
            } else {
                self.error = "Failed to upload image: \(error.localizedDescription)"
            }
        }

        isUploading = false
        print("🍽️ [DEBUG] uploadImage finished, isUploading=false")
    }
    
    func startAIPolling() async {
        print("🔄 [AI POLL] Starting AI polling for image \(imageId ?? -1)")
        
        // Poll every 2 seconds for up to 20 seconds (10 attempts)
        for attempt in 1...10 {
            try? await Task.sleep(nanoseconds: 2_000_000_000) // 2s
            print("📡 [AI POLL] Attempt \(attempt)/10")
            
            await fetchAIAnalysis()
            
            // Stop polling if we got both fields
            if !dish.isEmpty && !cuisine.isEmpty {
                print("✅ [AI POLL] AI analysis complete!")
                break
            }
        }
        
        print("🏁 [AI POLL] Polling finished")
    }

    func submitReview() async {
        guard let imageId = imageId,
              let authToken = authService.getAuthToken() else {
            error = "Image not uploaded or missing authentication"
            return
        }
        
        // Validate required fields
        guard !restaurantName.isEmpty else {
            error = "Please enter a restaurant name"
            return
        }
        
        guard rating > 0 else {
            error = "Please rate your experience"
            return
        }
        
        guard !userReview.isEmpty else {
            error = "Please write a review"
            return
        }

        isSubmitting = true
        error = nil

        do {
            let review = try await networkService.submitReview(
                imageId: imageId,
                userReview: userReview,
                restaurantName: restaurantName,
                rating: rating,
                authToken: authToken
            )
            successMessage = "Review posted successfully!"
            print("✅ Review created with ID: \(review.id)")
        } catch let error as NSError {
            print("❌ [DEBUG] Submit error: \(error.code) - \(error.localizedDescription)")
            if error.code == -1001 || error.code == -1004 {
                self.error = "⚠️ Backend server not running"
            } else {
                self.error = "Failed to post review: \(error.localizedDescription)"
            }
        }

        isSubmitting = false
    }

    func fetchAIAnalysis() async {
        guard let imageId = imageId,
              let authToken = authService.getAuthToken() else {
            print("⚠️ [AI FETCH] No imageId or auth token")
            return
        }

        print("🔍 [AI FETCH] Fetching AI analysis for image \(imageId)...")

        do {
            // Fetch the image data to get AI analysis
            let imageData = try await networkService.fetchImageData(imageId: imageId, authToken: authToken)

            print("✅ [AI FETCH] Got data - dish: \(imageData.dish ?? "nil"), cuisine: \(imageData.cuisine ?? "nil"), restaurant: \(imageData.suggestedRestaurant ?? "nil")")

            await MainActor.run {
                // Update dish and cuisine if AI has finished analyzing
                if let dish = imageData.dish, dish != "Analyzing...", dish != "Unknown Dish" {
                    print("🍽️ [AI FETCH] Setting dish: \(dish)")
                    self.dish = dish
                }
                if let cuisine = imageData.cuisine, cuisine != "Analyzing...", cuisine != "Unknown" {
                    print("🌎 [AI FETCH] Setting cuisine: \(cuisine)")
                    self.cuisine = cuisine
                }
                
                // Update restaurant name from AI suggestion (user can override)
                if let suggestedRestaurant = imageData.suggestedRestaurant, 
                   suggestedRestaurant != "Unknown",
                   self.restaurantName.isEmpty {  // Only auto-fill if empty
                    print("🏪 [AI FETCH] Setting restaurant: \(suggestedRestaurant)")
                    self.restaurantName = suggestedRestaurant
                }

                // Update location and timestamp from the uploaded image
                if let geolocation = imageData.geolocation {
                    print("📍 [AI FETCH] Setting location: \(geolocation)")
                    self.location = geolocation
                }
                if let timestamp = imageData.timestamp {
                    print("🕐 [AI FETCH] Setting timestamp: \(timestamp)")
                    self.timestamp = timestamp
                }
            }
        } catch {
            // Silently fail - AI analysis might not be ready yet
            print("⚠️ [AI FETCH ERROR] \(error)")
        }
    }
    
    func reset() {
        capturedImage = nil
        imageId = nil
        imageURL = nil
        restaurantName = ""
        rating = 0
        userReview = ""
        dish = ""
        cuisine = ""
        location = ""
        timestamp = Date()
        error = nil
        successMessage = nil
    }
}

