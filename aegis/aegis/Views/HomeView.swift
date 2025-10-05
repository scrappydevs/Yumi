//
//  HomeView.swift
//  aegis
//
//  Beautiful food reviews feed with Apple-inspired design
//

import SwiftUI

// MARK: - Identifiable Image Wrapper
struct IdentifiableImage: Identifiable {
    let id = UUID()
    let image: UIImage
}

struct HomeView: View {
    var onLoaded: (() -> Void)? = nil // Callback when initial load completes
    
    @ObservedObject private var authService = AuthService.shared
    @ObservedObject private var locationService = LocationService.shared

    @State private var reviews: [Review] = []
    @State private var isLoading = false
    @State private var hasCalledOnLoaded = false // Track if we've called the callback

    var body: some View {
        NavigationView {
            ZStack {
                // Gradient Background
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.95, green: 0.96, blue: 0.98),
                        Color(red: 0.98, green: 0.95, blue: 0.96)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // Reviews List
                if isLoading {
                    VStack {
                        ProgressView()
                            .scaleEffect(1.5)
                        Text("Loading reviews...")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.top)
                    }
                } else if reviews.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "fork.knife.circle")
                            .font(.system(size: 80))
                            .foregroundColor(.secondary.opacity(0.5))
                        Text("No Reviews Yet")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                        Text("Tap the camera button to review your first meal!")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(reviews) { review in
                                ReviewCard(review: review)
                            }
                        }
                        .padding()
                    }
                    .refreshable {
                        await loadReviews(bypassCache: true)
                    }
                }
            }
            .navigationTitle("My Reviews")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        Task {
                            try? await authService.signOut()
                        }
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .task {
                // Request location permission when view appears
                locationService.requestPermission()
                await loadReviews()
            }
        }
    }

    private func loadReviews(bypassCache: Bool = false) async {
        guard let authToken = authService.getAuthToken() else {
            // No auth token, still call callback
            if !hasCalledOnLoaded {
                hasCalledOnLoaded = true
                onLoaded?()
                print("🎯 [HOME] Called onLoaded callback (no auth)")
            }
            return
        }

        isLoading = true
        do {
            reviews = try await NetworkService.shared.fetchUserReviews(authToken: authToken, useCache: !bypassCache)
            print("✅ [HOME] Loaded \(reviews.count) reviews \(bypassCache ? "(fresh)" : "(cached or fresh)")")
        } catch {
            // Don't call onLoaded on cancellation (view was dismissed)
            if (error as NSError).code == NSURLErrorCancelled {
                print("⚠️ [HOME] Task cancelled, not calling onLoaded")
                isLoading = false
                return
            }
            
            print("❌ [HOME] Failed to load reviews: \(error)")
        }
        isLoading = false
        
        // Call onLoaded callback once (even if there was an error)
        if !hasCalledOnLoaded {
            hasCalledOnLoaded = true
            onLoaded?()
            print("🎯 [HOME] Called onLoaded callback")
        }
    }
}

// MARK: - Review Card Component
struct ReviewCard: View {
    let review: Review

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Food Image
            if let imageURL = review.imageURL, let url = URL(string: imageURL) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 200)
                            .clipShape(
                                UnevenRoundedRectangle(
                                    topLeadingRadius: 20,
                                    topTrailingRadius: 20
                                )
                            )
                            .overlay {
                                ProgressView()
                            }
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                            .frame(height: 200)
                            .frame(maxWidth: .infinity)
                            .clipped()
                            .clipShape(
                                UnevenRoundedRectangle(
                                    topLeadingRadius: 20,
                                    topTrailingRadius: 20
                                )
                            )
                    case .failure:
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 200)
                            .clipShape(
                                UnevenRoundedRectangle(
                                    topLeadingRadius: 20,
                                    topTrailingRadius: 20
                                )
                            )
                            .overlay {
                                Image(systemName: "photo")
                                    .font(.largeTitle)
                                    .foregroundColor(.gray)
                            }
                    @unknown default:
                        EmptyView()
                    }
                }
            }
            
            // Content
            VStack(alignment: .leading, spacing: 16) {
                // Header Section
                VStack(alignment: .leading, spacing: 8) {
                    // Restaurant Name
                    Text(review.restaurantName ?? "Unknown Restaurant")
                        .font(.system(.title3, design: .rounded))
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                    
                    // Dish & Cuisine (AI-generated) - Separate badges
                    HStack(spacing: 8) {
                        if review.dish != "Analyzing..." && review.dish != "Unknown Dish" {
                            Text(review.dish)
                                .font(.system(.caption, design: .rounded))
                                .fontWeight(.medium)
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color(.systemGray5))
                                .clipShape(Capsule())
                        }
                        
                        if review.cuisine != "Analyzing..." && review.cuisine != "Unknown" {
                            Text(review.cuisine)
                                .font(.system(.caption, design: .rounded))
                                .fontWeight(.medium)
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color(.systemGray5))
                                .clipShape(Capsule())
                        }
                    }
                }
                
                // Star Rating Display - OpenAI style
                HStack(spacing: 6) {
                    ForEach(1...5, id: \.self) { star in
                        Image(systemName: star <= review.rating ? "star.fill" : "star")
                            .font(.system(size: 14))
                            .foregroundColor(star <= review.rating ? Color.orange : Color(.systemGray4))
                    }
                    Text("\(review.rating).0")
                        .font(.system(.subheadline, design: .rounded))
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                }
                
                // User Review - Primary content
                Text(review.userReview)
                    .font(.system(.body, design: .default))
                    .foregroundColor(.primary)
                    .lineHeight(1.5)
                    .lineLimit(4)
                
                // Metadata Footer
                HStack(spacing: 12) {
                    // Date
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary.opacity(0.7))
                        Text(review.timestamp, style: .date)
                            .font(.system(.caption, design: .rounded))
                            .foregroundColor(.secondary)
                    }
                    
                    Text("·")
                    .font(.caption)
                        .foregroundColor(.secondary.opacity(0.5))
                    
                    // Location
                    HStack(spacing: 4) {
                        Image(systemName: "location.fill")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary.opacity(0.7))
                        Text(review.location)
                            .font(.system(.caption, design: .rounded))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
            }
            .padding(20)
        }
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.06), radius: 16, x: 0, y: 4)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(Color(.systemGray6), lineWidth: 1)
        )
    }
}

// MARK: - Sheet Content View
struct SheetContentView: View {
    @Binding var capturedImage: UIImage?
    @Binding var imageId: Int?

    var body: some View {
        Group {
            if let image = capturedImage {
                NavigationView {
                    ReviewFormView(capturedImage: image, uploadedImageId: imageId)
                }
                .onAppear {
                    print("📝 [DEBUG] ReviewFormView appeared with image of size \(image.size) and imageId: \(imageId ?? -1)")
                }
            } else {
                VStack {
                    Text("Error: No image")
                        .foregroundColor(.red)
                    Text("This shouldn't happen")
            .font(.caption)
                }
                .onAppear {
                    print("⚠️ [DEBUG] No image available in sheet!")
                }
            }
        }
    }
}

// MARK: - Text Extensions for Better Typography
extension Text {
    func lineHeight(_ height: CGFloat) -> some View {
        self.lineSpacing(height * 4)
    }
}

#Preview {
    HomeView()
}
