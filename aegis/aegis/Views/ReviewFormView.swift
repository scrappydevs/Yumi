//
//  ReviewFormView.swift
//  aegis
//
//  Beautiful food review form with Apple-inspired glassmorphism design
//

import SwiftUI

struct ReviewFormView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject var viewModel = ReviewSubmissionViewModel()
    let capturedImage: UIImage
    let uploadedImageId: Int?

    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.95, green: 0.96, blue: 0.98),
                    Color(red: 0.98, green: 0.95, blue: 0.96)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 24) {
                    // Image Preview with glassmorphism
                    if let image = viewModel.capturedImage {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                            .frame(height: 300)
                            .frame(maxWidth: .infinity)
                            .clipShape(RoundedRectangle(cornerRadius: 20))
                            .shadow(color: .black.opacity(0.1), radius: 20, x: 0, y: 10)
                    }
                    
                    // Restaurant Name Field
                    GlassCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Label("Restaurant", systemImage: "fork.knife")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            TextField("Enter restaurant name", text: $viewModel.restaurantName)
                                .padding(12)
                                .background(Color.white.opacity(0.5))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                    }
                    
                    // Dish & Cuisine (AI-powered)
                    GlassCard {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Label("Dish & Cuisine", systemImage: "sparkles")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                Spacer()
                                if viewModel.dish.isEmpty && viewModel.cuisine.isEmpty {
                                    Text("AI Analyzing...")
                                        .font(.caption)
                                        .foregroundColor(.blue)
                                }
                            }
                            
                            HStack(spacing: 12) {
                                TextField("Dish name", text: $viewModel.dish)
                                    .padding(12)
                                    .background(Color.white.opacity(0.5))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                
                                TextField("Cuisine", text: $viewModel.cuisine)
                                    .padding(12)
                                    .background(Color.white.opacity(0.5))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                    .frame(maxWidth: 130)
                            }
                            
                            Text("AI will auto-fill these, or you can edit them")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    // Star Rating
                    GlassCard {
                        VStack(spacing: 16) {
                            Text("Rate Your Experience")
                                .font(.headline)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            StarRatingView(rating: $viewModel.rating)
                                .frame(maxWidth: .infinity)
                            
                            if viewModel.rating > 0 {
                                Text(ratingText(for: viewModel.rating))
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                    .transition(.scale.combined(with: .opacity))
                            }
                        }
                    }
                    
                    // User Review (Editable)
                    GlassCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Label("Your Review", systemImage: "text.quote")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            ZStack(alignment: .topLeading) {
                                if viewModel.userReview.isEmpty {
                                    Text("Share your thoughts about this meal...")
                                        .foregroundColor(.secondary.opacity(0.5))
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 20)
                                }
                                
                                TextEditor(text: $viewModel.userReview)
                                    .frame(height: 120)
                                    .padding(8)
                                    .background(Color.white.opacity(0.3))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                    .scrollContentBackground(.hidden)
                            }
                        }
                    }
                    
                    // Location & Time Info
                    if !viewModel.location.isEmpty {
                        HStack(spacing: 12) {
                            Image(systemName: "location.fill")
                                .foregroundColor(.secondary)
                            Text(viewModel.location)
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            Image(systemName: "clock.fill")
                                .foregroundColor(.secondary)
                            Text(viewModel.timestamp, style: .time)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding(.horizontal)
                    }
                    
                    // Error Message
                    if let error = viewModel.error {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.red.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    
                    // Submit Button
                    Button {
                        Task {
                            await viewModel.submitReview()
                            if viewModel.successMessage != nil {
                                dismiss()
                            }
                        }
                    } label: {
                        ZStack {
                            if viewModel.isSubmitting {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Label("Post Review", systemImage: "paperplane.fill")
                                    .font(.headline)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            LinearGradient(
                                gradient: Gradient(colors: canSubmit ? [
                                    Color.blue,
                                    Color.blue.opacity(0.8)
                                ] : [Color.gray, Color.gray]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .shadow(color: canSubmit ? .blue.opacity(0.4) : .clear, radius: 20, x: 0, y: 10)
                    }
                    .disabled(!canSubmit)
                    .animation(.spring(response: 0.3), value: canSubmit)
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title3)
                        .foregroundColor(.secondary)
                }
            }
            
            ToolbarItem(placement: .principal) {
                Text("Food Review")
                    .font(.headline)
            }
        }
        .onAppear {
            // Image is already uploaded by the AI loading screen
            // Just set the data and fetch AI analysis (including location and timestamp)
            print("📝 [FORM] Setting image (id: \(uploadedImageId ?? -1)) and fetching AI data")
            viewModel.capturedImage = capturedImage
            viewModel.imageId = uploadedImageId

            Task {
                // Fetch AI analysis to populate dish, cuisine, location, and timestamp
                await viewModel.fetchAIAnalysis()
            }
        }
    }
    
    var canSubmit: Bool {
        !viewModel.isUploading &&
        !viewModel.isSubmitting &&
        viewModel.imageId != nil &&
        !viewModel.restaurantName.isEmpty &&
        !viewModel.userReview.isEmpty &&
        viewModel.rating > 0
    }
    
    func ratingText(for rating: Int) -> String {
        switch rating {
        case 1: return "Poor"
        case 2: return "Fair"
        case 3: return "Good"
        case 4: return "Great"
        case 5: return "Excellent!"
        default: return ""
        }
    }
}

// MARK: - Glassmorphism Card Component
struct GlassCard<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.white.opacity(0.7))
                    .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.white.opacity(0.5), lineWidth: 1)
            )
    }
}

