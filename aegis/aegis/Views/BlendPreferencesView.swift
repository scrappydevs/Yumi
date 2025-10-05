//
//  BlendPreferencesView.swift
//  aegis
//
//  Displays blended group preferences
//

import SwiftUI

struct BlendPreferencesView: View {
    @ObservedObject var viewModel: FriendsViewModel
    @Environment(\.dismiss) private var dismiss
    let selectedFriend: Profile? // Optional: if provided, blend with just this friend
    
    var navigationTitle: String {
        if let friend = selectedFriend {
            return "Blend with \(friend.displayNameOrUsername)"
        }
        return "Group Taste Profile"
    }
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isBlending {
                    loadingView
                } else if let blended = viewModel.blendedPreferences {
                    ScrollView {
                        blendedContentView(blended: blended)
                    }
                    .background(Color(.systemGroupedBackground))
                } else {
                    emptyStateView
                }
            }
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
        .task {
            if viewModel.blendedPreferences == nil {
                if let friend = selectedFriend {
                    // Blend with just this friend
                    await viewModel.blendPreferences(with: [friend])
                } else {
                    // Blend with all friends
                    await viewModel.blendPreferences()
                }
            }
        }
        .onDisappear {
            // Clear blended preferences when closing so next open recalculates
            viewModel.blendedPreferences = nil
        }
    }
    
    // MARK: - Loading View
    
    private var loadingView: some View {
        BlendLoadingView(friendName: selectedFriend?.displayNameOrUsername)
    }
    
    // MARK: - Empty State
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Spacer()
            
            Image(systemName: "person.2.slash")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No Preferences Yet")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Add friends and create reviews to build your group's taste profile!")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            Spacer()
            
            Button("Try Again") {
                Task {
                    await viewModel.blendPreferences()
                }
            }
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
        .padding()
    }
    
    // MARK: - Blended Content View
    
    private func blendedContentView(blended: BlendedPreferences) -> some View {
        VStack(spacing: 20) {
            // Profile Pictures Header
            if let myProfile = viewModel.myProfile {
                if blended.userCount == 2, let friend = selectedFriend {
                    // Two person blend - show both avatars overlapping
                    ZStack {
                        // Friend avatar (left)
                        ProfileAvatarView(avatarUrl: friend.avatarUrl, size: 70)
                            .offset(x: -25)
                        
                        // Current user avatar (right)
                        ProfileAvatarView(avatarUrl: myProfile.avatarUrl, size: 70)
                            .offset(x: 25)
                    }
                    .padding(.top, 20)
                } else {
                    // Group blend - show current user avatar only
                    ProfileAvatarView(avatarUrl: myProfile.avatarUrl, size: 70)
                        .padding(.top, 20)
                }
            }
            
            // Group info
            Text("\(blended.userCount) \(blended.userCount == 1 ? "Person" : "People")")
                .font(.caption)
                .foregroundColor(.secondary)
                .padding(.horizontal, 16)
                .padding(.vertical, 6)
                .background(Color(.systemGray6))
                .cornerRadius(12)
            
            // Main description card
            VStack(alignment: .leading, spacing: 12) {
                Text("Your Blend's Vibe")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(blended.blendedText)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .lineSpacing(4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
            .padding(.horizontal)
            
            // Cuisines section
            if !blended.topCuisines.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "fork.knife")
                            .foregroundColor(.blue)
                        Text("Top Cuisines")
                            .font(.headline)
                    }
                    
                    FlowLayout(spacing: 8) {
                        ForEach(blended.topCuisines, id: \.self) { cuisine in
                            cuisineTag(cuisine)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
                .padding(.horizontal)
            }
            
            // Atmosphere section
            if !blended.atmospherePreferences.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "sparkles")
                            .foregroundColor(.purple)
                        Text("Atmosphere")
                            .font(.headline)
                    }
                    
                    FlowLayout(spacing: 8) {
                        ForEach(blended.atmospherePreferences, id: \.self) { atmosphere in
                            atmosphereTag(atmosphere)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
                .padding(.horizontal)
            }
            
            // Price range section
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "dollarsign.circle")
                        .foregroundColor(.green)
                    Text("Price Range")
                        .font(.headline)
                }
                
                Text(blended.priceRange)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
            .padding(.horizontal)
            
            // Group members
            if !blended.userNames.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Group Members")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                    
                    HStack {
                        ForEach(Array(blended.userNames.prefix(5).enumerated()), id: \.offset) { index, name in
                            Text(name)
                                .font(.caption2)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(Color(.systemGray5))
                                .cornerRadius(8)
                        }
                        if blended.userNames.count > 5 {
                            Text("+\(blended.userNames.count - 5)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
            }
            
            Spacer(minLength: 20)
        }
    }
    
    // MARK: - Helper Views
    
    private func cuisineTag(_ cuisine: String) -> some View {
        Text(cuisine)
            .font(.subheadline)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.blue.opacity(0.1))
            .foregroundColor(.blue)
            .cornerRadius(8)
    }
    
    private func atmosphereTag(_ atmosphere: String) -> some View {
        Text(atmosphere.capitalized)
            .font(.subheadline)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.purple.opacity(0.1))
            .foregroundColor(.purple)
            .cornerRadius(8)
    }
}

// MARK: - Profile Avatar View

struct ProfileAvatarView: View {
    let avatarUrl: String?
    let size: CGFloat
    
    var body: some View {
        Group {
            if let urlString = avatarUrl, !urlString.isEmpty, let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        Circle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(width: size, height: size)
                            .overlay {
                                ProgressView()
                            }
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                            .frame(width: size, height: size)
                            .clipShape(Circle())
                    case .failure:
                        defaultAvatar
                    @unknown default:
                        defaultAvatar
                    }
                }
            } else {
                defaultAvatar
            }
        }
        .overlay {
            Circle()
                .stroke(Color.white, lineWidth: 3)
        }
        .shadow(color: Color.black.opacity(0.2), radius: 8, x: 0, y: 4)
    }
    
    private var defaultAvatar: some View {
        Circle()
            .fill(
                LinearGradient(
                    colors: [.blue.opacity(0.6), .purple.opacity(0.6)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(width: size, height: size)
            .overlay {
                Image(systemName: "person.fill")
                    .font(.system(size: size * 0.5))
                    .foregroundColor(.white)
            }
    }
}

// MARK: - Flow Layout for Tags

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.replacingUnspecifiedDimensions().width,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.frames[index].minX,
                                     y: bounds.minY + result.frames[index].minY),
                         proposal: ProposedViewSize(result.frames[index].size))
        }
    }
    
    struct FlowResult {
        var size: CGSize = .zero
        var frames: [CGRect] = []
        
        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0
            
            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)
                
                if currentX + size.width > maxWidth && currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }
                
                frames.append(CGRect(origin: CGPoint(x: currentX, y: currentY), size: size))
                currentX += size.width + spacing
                lineHeight = max(lineHeight, size.height)
            }
            
            self.size = CGSize(width: maxWidth, height: currentY + lineHeight)
        }
    }
}

// MARK: - Blend Loading Animation

struct BlendLoadingView: View {
    @State private var rotationAngle: Double = 0
    @State private var pulseScale: CGFloat = 1.0
    @State private var currentMessageIndex = 0
    let friendName: String?
    
    var messages: [String] {
        if let name = friendName {
            return [
                "Analyzing your tastes...",
                "Blending with \(name)...",
                "Finding common ground...",
                "Almost there...",
                "Just a moment..."
            ]
        } else {
            return [
                "Analyzing group preferences...",
                "Finding common cuisines...",
                "Blending taste profiles...",
                "Almost there...",
                "Just a moment..."
            ]
        }
    }
    
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
                                colors: [.purple.opacity(0.3), .blue.opacity(0.3)],
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
                
                // Fun footer text
                Text("🍽️ Powered by Gemini AI")
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

#Preview("Blend with Friend") {
    BlendLoadingView(friendName: "Julian")
}

#Preview("Blend with Group") {
    BlendLoadingView(friendName: nil)
}

#Preview {
    FriendsView()
}
