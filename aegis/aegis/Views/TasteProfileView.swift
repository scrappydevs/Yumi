//
//  TasteProfileView.swift
//  aegis
//
//  Interactive food similarity graph visualization
//

import SwiftUI

struct TasteProfileView: View {
    @StateObject private var viewModel = TasteProfileViewModel()
    @State private var showSimilaritySlider = false
    
    var body: some View {
        ZStack {
            // Light gradient background (matching HomeView)
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.95, green: 0.96, blue: 0.98),
                    Color(red: 0.98, green: 0.95, blue: 0.96)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            if viewModel.isLoading {
                loadingView
            } else if let error = viewModel.error {
                errorView(error)
            } else if let graphData = viewModel.graphData {
                if graphData.nodes.isEmpty {
                    emptyStateView
                } else {
                    graphView(graphData: graphData)
                }
            }
        }
        .navigationTitle("Taste Profile")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showSimilaritySlider.toggle()
                } label: {
                    Image(systemName: "slider.horizontal.3")
                        .foregroundColor(.blue)
                }
            }
        }
        .sheet(isPresented: $showSimilaritySlider) {
            similarityControlSheet
        }
        .sheet(item: $viewModel.selectedNode) { node in
            nodeDetailView(node: node)
        }
        .onChange(of: viewModel.selectedNode) { newValue in
            if newValue != nil {
                // Deselect edge when node is selected
                viewModel.deselectEdge()
            }
        }
        .onAppear {
            Task {
                await viewModel.loadGraph()
            }
        }
    }
    
    // MARK: - Graph Visualization
    @ViewBuilder
    private func graphView(graphData: FoodGraphData) -> some View {
        ScrollView {
            VStack(spacing: 20) {
                // AI Taste Profile Section
                if let profileText = viewModel.tasteProfileText {
                    tasteProfileCard(profileText: profileText)
                }
                
                // Stats header card
                statsCard(stats: graphData.stats)
                
                // Graph canvas card
                VStack(spacing: 0) {
                    // Card header
                    HStack {
                        Text("Food Network")
                            .font(.system(.headline, design: .rounded))
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        Text("\(graphData.nodes.count) foods")
                            .font(.system(.caption, design: .rounded))
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.white)
                    
                    Divider()
                    
                    // Graph visualization
                    ScrollView([.horizontal, .vertical], showsIndicators: false) {
                        ZStack {
                            // Draw edges first (behind nodes)
                            ForEach(graphData.edges) { edge in
                                EdgeView(
                                    edge: edge,
                                    sourcePos: viewModel.nodePositions[edge.source],
                                    targetPos: viewModel.nodePositions[edge.target],
                                    isSelected: viewModel.selectedEdge?.id == edge.id
                                )
                                .onTapGesture {
                                    viewModel.selectEdge(edge)
                                }
                            }
                            
                            // Draw nodes on top
                            ForEach(graphData.nodes) { node in
                                if let position = viewModel.nodePositions[node.id] {
                                    NodeView(node: node)
                                        .position(x: position.x, y: position.y)
                                        .onTapGesture {
                                            viewModel.selectNode(node)
                                        }
                                }
                            }
                            
                            // Show similarity percentage on selected edge
                            if let selectedEdge = viewModel.selectedEdge,
                               let sourcePos = viewModel.nodePositions[selectedEdge.source],
                               let targetPos = viewModel.nodePositions[selectedEdge.target] {
                                let midX = (sourcePos.x + targetPos.x) / 2
                                let midY = (sourcePos.y + targetPos.y) / 2
                                
                                Text("\(Int(selectedEdge.weight * 100))%")
                                    .font(.system(.caption, design: .rounded))
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(
                                        Capsule()
                                            .fill(Color.blue)
                                            .shadow(color: .blue.opacity(0.4), radius: 8, x: 0, y: 2)
                                    )
                                    .position(x: midX, y: midY)
                                    .transition(.scale.combined(with: .opacity))
                            }
                        }
                        .frame(width: 400, height: 500)
                    }
                    .frame(height: 500)
                    .background(Color(.systemGray6).opacity(0.3))
                    .onTapGesture {
                        // Deselect edge when tapping background
                        viewModel.deselectEdge()
                    }
                }
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 2)
                
                // Instruction text
                Text("Tap food circles for details • Tap connecting lines for similarity %")
                    .font(.system(.caption, design: .rounded))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            .padding()
        }
    }
    
    // MARK: - Stats Card
    @ViewBuilder
    private func statsCard(stats: FoodGraphData.GraphStats?) -> some View {
        if let stats = stats {
            VStack(alignment: .leading, spacing: 16) {
                Text("Your Taste Network")
                    .font(.system(.title3, design: .rounded))
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                HStack(spacing: 16) {
                    StatPill(
                        icon: "fork.knife",
                        value: "\(stats.totalFoods)",
                        label: "Foods"
                    )
                    
                    StatPill(
                        icon: "arrow.triangle.branch",
                        value: "\(stats.totalConnections)",
                        label: "Links"
                    )
                    
                    StatPill(
                        icon: "percent",
                        value: "\(Int(stats.minSimilarity * 100))",
                        label: "Threshold"
                    )
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 2)
        }
    }
    
    // MARK: - Taste Profile Card
    @ViewBuilder
    private func tasteProfileCard(profileText: String) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.blue)
                    .font(.title2)
                
                Text("AI Taste Profile")
                    .font(.system(.title3, design: .rounded))
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            Text(profileText)
                .font(.system(.body, design: .rounded))
                .foregroundColor(.secondary)
                .lineLimit(nil)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 2)
    }
    
    // MARK: - Loading State
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Analyzing your taste profile...")
                .font(.system(.subheadline, design: .rounded))
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Error State
    @ViewBuilder
    private func errorView(_ message: String) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 60))
                .foregroundColor(.secondary.opacity(0.5))
            
            Text(message)
                .font(.system(.body, design: .rounded))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button {
                Task {
                    await viewModel.refreshGraph()
                }
            } label: {
                Text("Try Again")
                    .font(.system(.body, design: .rounded))
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: 200)
                    .padding()
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [.blue, .blue.opacity(0.8)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .shadow(color: .blue.opacity(0.3), radius: 10, x: 0, y: 5)
            }
        }
        .padding()
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "chart.pie")
                .font(.system(size: 80))
                .foregroundColor(.secondary.opacity(0.5))
            
            Text("No Taste Profile Yet")
                .font(.system(.title2, design: .rounded))
                .fontWeight(.semibold)
                .foregroundColor(.primary)
            
            Text("Review at least 2 foods to see your taste connections!")
                .font(.system(.subheadline, design: .rounded))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }
    
    // MARK: - Similarity Control Sheet
    private var similarityControlSheet: some View {
        NavigationView {
            VStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Minimum Similarity")
                        .font(.headline)
                    
                    HStack {
                        Text("Less Connected")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        Text("More Connected")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Slider(value: $viewModel.minSimilarity, in: 0.3...0.8, step: 0.05)
                    
                    Text("\(Int(viewModel.minSimilarity * 100))% similarity threshold")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.systemGray6))
                )
                
                Button {
                    showSimilaritySlider = false
                    Task {
                        await viewModel.refreshGraph()
                    }
                } label: {
                    Text("Update Graph")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(12)
                }
                
                Spacer()
            }
            .padding()
            .navigationTitle("Graph Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showSimilaritySlider = false
                    }
                }
            }
        }
        .presentationDetents([.height(300)])
    }
    
    // MARK: - Node Detail View
    @ViewBuilder
    private func nodeDetailView(node: FoodNode) -> some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Food image
                    if let imageURL = node.imageURL, let url = URL(string: imageURL) {
                        AsyncImage(url: url) { image in
                            image
                                .resizable()
                                .scaledToFill()
                        } placeholder: {
                            Rectangle()
                                .fill(Color.gray.opacity(0.3))
                                .overlay(
                                    ProgressView()
                                )
                        }
                        .frame(height: 250)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .padding(.horizontal)
                    } else {
                        // Fallback when no image
                        Rectangle()
                            .fill(cuisineColor(node.cuisine).opacity(0.3))
                            .overlay(
                                VStack {
                                    Image(systemName: "fork.knife")
                                        .font(.system(size: 50))
                                        .foregroundColor(.white.opacity(0.5))
                                    Text(node.dish)
                                        .font(.title2)
                                        .foregroundColor(.white)
                                }
                            )
                            .frame(height: 250)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .padding(.horizontal)
                    }
                    
                    // Details
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(node.dish)
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            HStack {
                                Label(node.cuisine, systemImage: "globe")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                
                                Spacer()
                                
                                HStack(spacing: 2) {
                                    ForEach(0..<node.starRating, id: \.self) { _ in
                                        Image(systemName: "star.fill")
                                            .font(.caption)
                                            .foregroundColor(.yellow)
                                    }
                                }
                            }
                        }
                        
                        Divider()
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Label("Restaurant", systemImage: "fork.knife")
                                .font(.headline)
                            Text(node.restaurantName)
                                .font(.body)
                        }
                        
                        Divider()
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Label("AI Analysis", systemImage: "sparkles")
                                .font(.headline)
                            Text(node.description)
                                .font(.body)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("Food Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        viewModel.deselectNode()
                    }
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct EdgeView: View {
    let edge: GraphEdge
    let sourcePos: NodePosition?
    let targetPos: NodePosition?
    let isSelected: Bool
    
    var body: some View {
        if let source = sourcePos, let target = targetPos {
            Path { path in
                path.move(to: CGPoint(x: source.x, y: source.y))
                path.addLine(to: CGPoint(x: target.x, y: target.y))
            }
            .stroke(
                isSelected ? Color.blue : Color.gray.opacity(0.3),
                lineWidth: isSelected ? 3 : 2
            )
            .animation(.easeInOut(duration: 0.2), value: isSelected)
        }
    }
}

struct NodeView: View {
    let node: FoodNode
    
    var body: some View {
        VStack(spacing: 4) {
            if let imageURL = node.imageURL, let url = URL(string: imageURL) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    Circle()
                        .fill(cuisineColor(node.cuisine).opacity(0.2))
                        .overlay(
                            Text(String(node.dish.prefix(1)))
                                .font(.system(.title3, design: .rounded))
                                .fontWeight(.semibold)
                                .foregroundColor(cuisineColor(node.cuisine))
                        )
                }
                .frame(width: 50, height: 50)
                .clipShape(Circle())
                .overlay(
                    Circle()
                        .stroke(Color.white, lineWidth: 2)
                )
                .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
            } else {
                // Fallback when no image URL
                Circle()
                    .fill(cuisineColor(node.cuisine).opacity(0.2))
                    .overlay(
                        Text(String(node.dish.prefix(1)))
                            .font(.system(.title3, design: .rounded))
                            .fontWeight(.semibold)
                            .foregroundColor(cuisineColor(node.cuisine))
                    )
                    .frame(width: 50, height: 50)
                    .overlay(
                        Circle()
                            .stroke(Color.white, lineWidth: 2)
                    )
                    .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
            }
            
            Text(node.dish)
                .font(.system(size: 9, weight: .medium, design: .rounded))
                .foregroundColor(.primary)
                .lineLimit(1)
                .frame(maxWidth: 60)
        }
    }
}

struct StatPill: View {
    let icon: String
    let value: String
    let label: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(.caption, design: .rounded))
                .foregroundColor(.secondary)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.system(.body, design: .rounded))
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text(label)
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

// MARK: - Helper Functions
func cuisineColor(_ cuisine: String) -> Color {
    switch cuisine.lowercased() {
    case "italian": return .red
    case "chinese", "japanese", "korean": return .orange
    case "mexican": return .green
    case "indian": return .yellow
    case "american": return .blue
    case "french": return .purple
    default: return .gray
    }
}

#Preview {
    NavigationStack {
        TasteProfileView()
    }
}

