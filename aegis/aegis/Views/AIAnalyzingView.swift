//
//  AIAnalyzingView.swift
//  aegis
//
//  OpenAI/PostHog-inspired loading screen with personality
//

import SwiftUI

struct AIAnalyzingView: View {
    @State private var rotationAngle: Double = 0
    @State private var pulseScale: CGFloat = 1.0
    @State private var currentMessageIndex = 0
    
    let messages = [
        "Analyzing your meal...",
        "Identifying flavors...",
        "Detecting cuisine...",
        "Almost there...",
        "Just a moment..."
    ]
    
    var body: some View {
        ZStack {
            // Pure white background
            Color.white
                .ignoresSafeArea()
            
            VStack(spacing: 40) {
                Spacer()
                
                // Animated Icon Stack
                ZStack {
                    // Outer rotating ring
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [.blue.opacity(0.3), .green.opacity(0.3)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 3
                        )
                        .frame(width: 120, height: 120)
                        .rotationEffect(.degrees(rotationAngle))
                    
                    // Yummy Logo
                    Image("yummylogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 70, height: 70)
                        .scaleEffect(pulseScale)
                }
                
                // Animated Text
                VStack(spacing: 16) {
                    Text(messages[currentMessageIndex])
                        .font(.system(.title3, design: .rounded))
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                        .transition(.asymmetric(
                            insertion: .move(edge: .bottom).combined(with: .opacity),
                            removal: .move(edge: .top).combined(with: .opacity)
                        ))
                        .id("message-\(currentMessageIndex)")
                    
                    // Animated dots
                    HStack(spacing: 8) {
                        ForEach(0..<3) { index in
                            Circle()
                                .fill(Color.secondary.opacity(0.6))
                                .frame(width: 8, height: 8)
                                .scaleEffect(pulseScale)
                                .animation(
                                    .easeInOut(duration: 0.6)
                                        .repeatForever()
                                        .delay(Double(index) * 0.2),
                                    value: pulseScale
                                )
                        }
                    }
                }
                
                Spacer()
                
                // Fun footer text (PostHog style)
                Text("🍽️ Powered by AI")
                    .font(.system(.caption, design: .rounded))
                    .foregroundColor(.secondary)
                    .padding(.bottom, 40)
            }
        }
        .onAppear {
            startAnimations()
        }
    }
    
    private func startAnimations() {
        // Rotate the outer ring continuously
        withAnimation(.linear(duration: 3).repeatForever(autoreverses: false)) {
            rotationAngle = 360
        }
        
        // Pulse the sparkles
        withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) {
            pulseScale = 1.2
        }
        
        // Cycle through messages
        Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { timer in
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                currentMessageIndex = (currentMessageIndex + 1) % messages.count
            }
        }
    }
}

// MARK: - Alternative: Minimal Dots Animation
struct MinimalLoadingView: View {
    @State private var isAnimating = false
    
    var body: some View {
        ZStack {
            Color.white.ignoresSafeArea()
            
            VStack(spacing: 24) {
                // Three bouncing dots
                HStack(spacing: 12) {
                    ForEach(0..<3) { index in
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.blue, .green],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .frame(width: 16, height: 16)
                            .offset(y: isAnimating ? -20 : 0)
                            .animation(
                                .easeInOut(duration: 0.6)
                                    .repeatForever()
                                    .delay(Double(index) * 0.15),
                                value: isAnimating
                            )
                    }
                }
                
                Text("Analyzing...")
                    .font(.system(.body, design: .rounded))
                    .foregroundColor(.secondary)
            }
        }
        .onAppear {
            isAnimating = true
        }
    }
}

// MARK: - Loading View with Upload Logic
struct AIAnalyzingLoadingView: View {
    @Binding var capturedImage: UIImage?
    @Binding var uploadedImageId: Int?
    var onComplete: () -> Void
    
    @StateObject private var uploadManager = ImageUploadManager()
    
    var body: some View {
        AIAnalyzingView()
            .onAppear {
                guard let image = capturedImage else {
                    print("⚠️ [AI LOADING] No image to upload")
                    onComplete()
                    return
                }
                
                print("🚀 [AI LOADING] Starting image upload and AI analysis")
                Task {
                    let imageId = await uploadManager.uploadAndWaitForAI(image: image)
                    uploadedImageId = imageId
                    print("✅ [AI LOADING] AI analysis complete! ImageId: \(imageId ?? -1)")
                    onComplete()
                }
            }
    }
}

// MARK: - Upload Manager
@MainActor
class ImageUploadManager: ObservableObject {
    @Published var isComplete = false
    
    private let networkService = NetworkService.shared
    private let authService = AuthService.shared
    private let locationService = LocationService.shared
    
    func uploadAndWaitForAI(image: UIImage) async -> Int? {
        print("🚀 [AI UPLOAD] Starting image upload...")
        let startTime = Date()
        let minLoadingTime: TimeInterval = 2.0 // At least 2 seconds for smooth UX
        var imageId: Int?
        
        // Get auth token
        guard let authToken = authService.getAuthToken() else {
            print("❌ [AI UPLOAD] No auth token")
            isComplete = true
            return nil
        }
        
        // Get location
        let location: String
        var latitude: Double?
        var longitude: Double?
        
        do {
            location = try await locationService.getCurrentLocation()
            print("📍 [AI UPLOAD] Got location: \(location)")
            
            // Parse coordinates for restaurant matching
            let coords = location.split(separator: ",")
            if coords.count == 2 {
                latitude = Double(coords[0].trimmingCharacters(in: .whitespaces))
                longitude = Double(coords[1].trimmingCharacters(in: .whitespaces))
                print("📍 [AI UPLOAD] Parsed coords: lat=\(latitude ?? 0), lon=\(longitude ?? 0)")
            }
        } catch {
            print("⚠️ [AI UPLOAD] Using fallback location")
            location = "40.4406,-79.9959"
            latitude = 40.4406
            longitude = -79.9959
        }
        
        // Upload image with coordinates for restaurant matching
        do {
            let uploadResponse = try await networkService.uploadImage(
                image: image,
                location: location,
                timestamp: Date(),
                latitude: latitude,
                longitude: longitude,
                authToken: authToken
            )
            imageId = uploadResponse.imageId
            print("✅ [AI UPLOAD] Image uploaded! ID: \(uploadResponse.imageId)")
            
            // Poll for AI analysis completion (max 12 seconds)
            print("🔄 [AI UPLOAD] Waiting for AI analysis...")
            for attempt in 1...24 {
                try? await Task.sleep(nanoseconds: 500_000_000) // 0.5s per check
                
                // Fetch image data to check if AI is done
                if let imageData = try? await networkService.fetchImageData(
                    imageId: uploadResponse.imageId,
                    authToken: authToken
                ) {
                    let hasDish = imageData.dish != nil && imageData.dish != "Analyzing..." && imageData.dish != "Unknown Dish"
                    let hasCuisine = imageData.cuisine != nil && imageData.cuisine != "Analyzing..." && imageData.cuisine != "Unknown"
                    
                    if hasDish && hasCuisine {
                        print("✅ [AI UPLOAD] AI complete! Dish: \(imageData.dish ?? ""), Cuisine: \(imageData.cuisine ?? "")")
                        break
                    } else {
                        print("⏳ [AI UPLOAD] Poll \(attempt)/24 - Still analyzing...")
                    }
                }
            }
            
        } catch {
            print("❌ [AI UPLOAD] Upload failed: \(error)")
        }
        
        // Ensure minimum loading time has passed (feels more intentional)
        let elapsed = Date().timeIntervalSince(startTime)
        if elapsed < minLoadingTime {
            let remaining = minLoadingTime - elapsed
            print("⏱️ [AI UPLOAD] Waiting \(String(format: "%.1f", remaining))s for smooth UX")
            try? await Task.sleep(nanoseconds: UInt64(remaining * 1_000_000_000))
        }
        
        print("✅ [AI UPLOAD] Complete! Total time: \(String(format: "%.1f", Date().timeIntervalSince(startTime)))s")
        isComplete = true
        return imageId
    }
}

#Preview("AI Analyzing") {
    AIAnalyzingView()
}

#Preview("Minimal Loading") {
    MinimalLoadingView()
}

#Preview("Full Loading Flow") {
    struct PreviewWrapper: View {
        @State var image: UIImage? = UIImage(systemName: "photo")
        @State var imageId: Int?
        
        var body: some View {
            AIAnalyzingLoadingView(capturedImage: $image, uploadedImageId: $imageId) {
                print("Complete!")
            }
        }
    }
    return PreviewWrapper()
}

