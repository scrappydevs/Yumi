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
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    if viewModel.isBlending {
                        loadingView
                    } else if let blended = viewModel.blendedPreferences {
                        blendedContentView(blended: blended)
                    } else {
                        emptyStateView
                    }
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Group Taste Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .task {
            if viewModel.blendedPreferences == nil {
                await viewModel.blendPreferences()
            }
        }
    }
    
    // MARK: - Loading View
    
    private var loadingView: some View {
        VStack(spacing: 20) {
            Spacer()
            
            ProgressView()
                .scaleEffect(1.5)
            
            Text("Blending preferences...")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text("Analyzing your group's taste profile 🍽️")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
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
            // Header emoji
            Text("🍽️")
                .font(.system(size: 60))
                .padding(.top, 20)
            
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
                Text("Your Group's Vibe")
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
                        ForEach(blended.userNames.prefix(5), id: \.self) { name in
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

#Preview {
    FriendsView()
}
