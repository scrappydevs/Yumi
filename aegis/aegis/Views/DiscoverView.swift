//
//  DiscoverView.swift
//  aegis
//
//  Discover personalized restaurant recommendations
//

import SwiftUI

struct DiscoverView: View {
    var onLoaded: (() -> Void)? = nil // Callback when initial load completes
    
    @State private var restaurants: [Restaurant] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var reasoning: String = ""
    @State private var hasCalledOnLoaded = false // Track if we've called the callback
    
    // Search state
    @State private var searchQuery: String = ""
    @State private var isSearching = false
    @State private var searchResults: [Restaurant] = []
    @State private var isSearchLoading = false
    @State private var searchError: String?
    @FocusState private var isSearchFocused: Bool
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [.blue.opacity(0.1), .purple.opacity(0.1)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // Header
                        VStack(spacing: 8) {
                            Text("Discover")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                            
                            Text("Personalized picks just for you")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .padding(.top)
                        .padding(.bottom, 8)
                        
                        // Loading state
                        if isLoading {
                            VStack(spacing: 16) {
                                ProgressView()
                                    .scaleEffect(1.5)
                                Text("Finding perfect spots...")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            .frame(height: 300)
                        }
                        
                        // Error state
                        else if let error = errorMessage {
                            VStack(spacing: 16) {
                                Image(systemName: "exclamationmark.triangle")
                                    .font(.system(size: 50))
                                    .foregroundColor(.orange)
                                Text(error)
                                    .multilineTextAlignment(.center)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal)
                                Button("Try Again") {
                                    Task { await loadRecommendations() }
                                }
                                .buttonStyle(.borderedProminent)
                            }
                            .padding()
                            .frame(height: 300)
                        }
                        
                        // Restaurant cards
                        else if !restaurants.isEmpty {
                            // AI Reasoning (if available)
                            if !reasoning.isEmpty {
                                Text(reasoning)
                                    .font(.callout)
                                    .foregroundColor(.secondary)
                                    .padding()
                                    .background(Color.white.opacity(0.7))
                                    .cornerRadius(12)
                                    .padding(.horizontal)
                            }
                            
                            ForEach(restaurants) { restaurant in
                                RestaurantCard(restaurant: restaurant)
                                    .padding(.horizontal)
                            }
                            
                            // Search bar
                            VStack(spacing: 12) {
                                Divider()
                                    .padding(.horizontal)
                                
                                Text("Looking for something specific?")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                
                                SearchBarButton {
                                    isSearching = true
                                    // Delay focus slightly to let keyboard animation sync
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                                        isSearchFocused = true
                                    }
                                }
                            }
                            .padding(.vertical)
                        }
                        
                        // Empty state
                        else {
                            VStack(spacing: 16) {
                                Image(systemName: "fork.knife.circle")
                                    .font(.system(size: 60))
                                    .foregroundColor(.gray)
                                Text("No recommendations yet")
                                    .font(.headline)
                                Text("Tap below to discover restaurants")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                Button("Discover Now") {
                                    Task { await loadRecommendations() }
                                }
                                .buttonStyle(.borderedProminent)
                            }
                            .frame(height: 300)
                        }
                    }
                }
                .refreshable {
                    // Pull-to-refresh action
                    await loadRecommendations()
                }
                
                // Search overlay
                if isSearching {
                    SearchOverlay(
                        searchQuery: $searchQuery,
                        isSearchFocused: $isSearchFocused,
                        searchResults: $searchResults,
                        isSearchLoading: $isSearchLoading,
                        searchError: $searchError,
                        onDismiss: {
                            isSearching = false
                            searchQuery = ""
                            searchResults = []
                            searchError = nil
                        },
                        onSearch: {
                            await performSearch()
                        }
                    )
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
        .task {
            // Auto-load on appear
            await loadRecommendations()
        }
    }
    
    private func loadRecommendations() async {
        isLoading = true
        errorMessage = nil
        
        do {
            print("🌟 [DISCOVER] Starting to load recommendations...")
            
            // Get user's location
            let locationString = try await LocationService.shared.getCurrentLocation()
            print("📍 [DISCOVER] Location: \(locationString)")
            
            let coords = locationString.split(separator: ",")
            guard coords.count == 2,
                  let latitude = Double(coords[0]),
                  let longitude = Double(coords[1]) else {
                print("❌ [DISCOVER] Invalid location format")
                throw NSError(domain: "Invalid location", code: -1)
            }
            
            // Get auth token
            guard let token = await AuthService.shared.getAuthToken() else {
                print("❌ [DISCOVER] No auth token")
                throw NSError(domain: "Not authenticated", code: 401)
            }
            
            print("🔑 [DISCOVER] Got auth token, calling API...")
            
            // Fetch recommendations
            let response = try await NetworkService.shared.discoverRestaurants(
                latitude: latitude,
                longitude: longitude,
                authToken: token
            )
            
            print("✅ [DISCOVER] Got \(response.restaurants.count) restaurants")
            
            restaurants = response.restaurants
            reasoning = response.reasoning ?? ""
            
        } catch {
            // Don't call onLoaded on cancellation (view was dismissed)
            if (error as NSError).code == NSURLErrorCancelled || 
               String(describing: error).contains("CancellationError") {
                print("⚠️ [DISCOVER] Task cancelled, not calling onLoaded")
                return
            }
            
            errorMessage = "Failed to load recommendations: \(error.localizedDescription)"
            print("❌ [DISCOVER] Error: \(error)")
        }
        
        isLoading = false
        
        // Call onLoaded callback once (even if there was an error)
        if !hasCalledOnLoaded {
            hasCalledOnLoaded = true
            onLoaded?()
            print("🎯 [DISCOVER] Called onLoaded callback")
        }
    }
    
    private func performSearch() async {
        guard !searchQuery.trimmingCharacters(in: .whitespaces).isEmpty else {
            searchError = "Please enter a search query"
            return
        }
        
        isSearchLoading = true
        searchError = nil
        
        do {
            print("🔍 [SEARCH] Starting search for: '\(searchQuery)'")
            
            // Get user's location
            let locationString = try await LocationService.shared.getCurrentLocation()
            let coords = locationString.split(separator: ",")
            guard coords.count == 2,
                  let latitude = Double(coords[0]),
                  let longitude = Double(coords[1]) else {
                throw NSError(domain: "Invalid location", code: -1)
            }
            
            // Get auth token
            guard let token = await AuthService.shared.getAuthToken() else {
                throw NSError(domain: "Not authenticated", code: 401)
            }
            
            print("🔍 [SEARCH] Calling search API...")
            
            // Call search endpoint
            let response = try await NetworkService.shared.searchRestaurants(
                query: searchQuery,
                latitude: latitude,
                longitude: longitude,
                authToken: token
            )
            
            print("✅ [SEARCH] Got \(response.restaurants.count) results")
            searchResults = response.restaurants
            
        } catch {
            searchError = "Search failed: \(error.localizedDescription)"
            print("❌ [SEARCH] Error: \(error)")
        }
        
        isSearchLoading = false
    }
}

// MARK: - Restaurant Card Component
struct RestaurantCard: View {
    let restaurant: Restaurant
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Restaurant name & rating
            HStack {
                Text(restaurant.name)
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                if let rating = restaurant.rating {
                    HStack(spacing: 4) {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                        Text(String(format: "%.1f", rating))
                            .fontWeight(.semibold)
                    }
                }
            }
            
            // Cuisine & Distance
            HStack {
                if let cuisine = restaurant.cuisine {
                    Label(cuisine, systemImage: "fork.knife")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                if let distance = restaurant.distance {
                    Label(distance, systemImage: "location")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                if let price = restaurant.priceLevel {
                    Text(String(repeating: "$", count: price))
                        .font(.subheadline)
                        .foregroundColor(.green)
                }
            }
            
            // Description
            if let description = restaurant.description {
                Text(description)
                    .font(.body)
                    .foregroundColor(.primary)
                    .lineLimit(3)
            }
            
            // Address
            if let address = restaurant.address {
                Text(address)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, y: 4)
    }
}

// MARK: - Search Bar Button
struct SearchBarButton: View {
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                Text("Search for restaurants...")
                    .foregroundColor(.gray)
                Spacer()
            }
            .padding()
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
        }
        .padding(.horizontal)
    }
}

// MARK: - Search Overlay
struct SearchOverlay: View {
    @Binding var searchQuery: String
    var isSearchFocused: FocusState<Bool>.Binding
    @Binding var searchResults: [Restaurant]
    @Binding var isSearchLoading: Bool
    @Binding var searchError: String?
    let onDismiss: () -> Void
    let onSearch: () async -> Void

    @State private var keyboardHeight: CGFloat = 0

    var body: some View {
        ZStack {
            // Modern gradient background
            LinearGradient(
                colors: [
                    Color(red: 0.05, green: 0.05, blue: 0.15),
                    Color(red: 0.1, green: 0.05, blue: 0.2)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            .onTapGesture {
                onDismiss()
            }

            VStack(spacing: 0) {
                // Top bar with close button
                HStack {
                    Button(action: onDismiss) {
                        Image(systemName: "xmark")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundColor(.white.opacity(0.9))
                            .frame(width: 36, height: 36)
                            .background(Color.white.opacity(0.1))
                            .clipShape(Circle())
                    }
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 12)

                // Results area
                if isSearchLoading || !searchResults.isEmpty || searchError != nil {
                    ScrollView {
                        VStack(spacing: 12) {
                            if isSearchLoading {
                                VStack(spacing: 20) {
                                    // AI-style loading animation
                                    ZStack {
                                        Circle()
                                            .stroke(
                                                LinearGradient(
                                                    colors: [.blue, .purple, .pink, .blue],
                                                    startPoint: .leading,
                                                    endPoint: .trailing
                                                ),
                                                lineWidth: 3
                                            )
                                            .frame(width: 50, height: 50)
                                            .rotationEffect(.degrees(0))

                                        ProgressView()
                                            .tint(.white)
                                    }
                                    .padding(.top, 80)

                                    Text("Searching...")
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(.white.opacity(0.8))
                                }
                                .frame(maxWidth: .infinity)
                            }
                            else if let error = searchError {
                                VStack(spacing: 16) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .font(.system(size: 50))
                                        .foregroundStyle(
                                            LinearGradient(
                                                colors: [.orange, .red],
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            )
                                        )
                                    Text(error)
                                        .font(.system(size: 15))
                                        .foregroundColor(.white.opacity(0.8))
                                        .multilineTextAlignment(.center)
                                        .padding(.horizontal, 32)
                                }
                                .padding(.top, 80)
                            }
                            else if !searchResults.isEmpty {
                                ForEach(searchResults) { restaurant in
                                    RestaurantCard(restaurant: restaurant)
                                        .padding(.horizontal, 16)
                                }
                                .padding(.top, 12)
                            }
                        }
                        .padding(.bottom, 200)
                    }
                } else {
                    Spacer()

                    // Empty state with AI-style design
                    VStack(spacing: 24) {
                        // Animated icon
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            Color.blue.opacity(0.3),
                                            Color.purple.opacity(0.3)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 100, height: 100)
                                .blur(radius: 20)

                            Image(systemName: "sparkles.rectangle.stack.fill")
                                .font(.system(size: 50, weight: .light))
                                .foregroundStyle(
                                    LinearGradient(
                                        colors: [.blue, .cyan, .purple],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                        }

                        VStack(spacing: 8) {
                            Text("AI-Powered Restaurant Search")
                                .font(.system(size: 24, weight: .bold))
                                .foregroundColor(.white)

                            Text("Discover amazing places to eat")
                                .font(.system(size: 16))
                                .foregroundColor(.white.opacity(0.7))
                        }

                        // Suggestions
                        VStack(spacing: 8) {
                            Text("Try searching for:")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.white.opacity(0.5))

                            HStack(spacing: 8) {
                                ForEach(["Italian", "Sushi", "Pizza"], id: \.self) { suggestion in
                                    Text(suggestion)
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 8)
                                        .background(
                                            RoundedRectangle(cornerRadius: 20)
                                                .fill(Color.white.opacity(0.1))
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 20)
                                                        .stroke(
                                                            LinearGradient(
                                                                colors: [.blue.opacity(0.5), .purple.opacity(0.5)],
                                                                startPoint: .leading,
                                                                endPoint: .trailing
                                                            ),
                                                            lineWidth: 1
                                                        )
                                                )
                                        )
                                        .onTapGesture {
                                            searchQuery = suggestion
                                            Task { await onSearch() }
                                        }
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)

                    Spacer()
                }

                // Modern search bar
                HStack(spacing: 12) {
                    // Search icon with gradient
                    Image(systemName: "sparkles")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )

                    TextField("", text: $searchQuery, prompt: Text("Ask me anything about restaurants...")
                        .foregroundColor(.white.opacity(0.4)))
                        .focused(isSearchFocused)
                        .foregroundColor(.white)
                        .onSubmit {
                            Task { await onSearch() }
                        }
                        .submitLabel(.search)

                    if !searchQuery.isEmpty {
                        Button {
                            searchQuery = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.white.opacity(0.5))
                                .font(.system(size: 18))
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 28)
                        .fill(Color.white.opacity(0.12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 28)
                                .stroke(
                                    LinearGradient(
                                        colors: isSearchFocused.wrappedValue ?
                                            [.blue, .purple, .pink] :
                                            [Color.white.opacity(0.15), Color.white.opacity(0.15)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    ),
                                    lineWidth: isSearchFocused.wrappedValue ? 2 : 1
                                )
                        )
                        .shadow(
                            color: isSearchFocused.wrappedValue ?
                                Color.blue.opacity(0.3) : Color.clear,
                            radius: 20,
                            y: 10
                        )
                )
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
            .padding(.bottom, keyboardHeight)
            .animation(.spring(response: 0.3, dampingFraction: 0.8), value: keyboardHeight)
        }
        .ignoresSafeArea(.keyboard)
        .onAppear {
            NotificationCenter.default.addObserver(
                forName: UIResponder.keyboardWillShowNotification,
                object: nil,
                queue: .main
            ) { notification in
                if let keyboardFrame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect {
                    keyboardHeight = keyboardFrame.height
                }
            }

            NotificationCenter.default.addObserver(
                forName: UIResponder.keyboardWillHideNotification,
                object: nil,
                queue: .main
            ) { _ in
                print("⌨️ [KEYBOARD] keyboardWillHideNotification received")
                print("⌨️ [KEYBOARD] Setting keyboardHeight from \(keyboardHeight) to 0")
                withAnimation(.easeOut(duration: 0.25)) {
                    keyboardHeight = 0
                }
                print("⌨️ [KEYBOARD] keyboardHeight set to: 0")
            }
        }
    }
}

// MARK: - Visual Effect Blur Helper
struct VisualEffectBlur: UIViewRepresentable {
    var blurStyle: UIBlurEffect.Style
    
    func makeUIView(context: Context) -> UIVisualEffectView {
        return UIVisualEffectView(effect: UIBlurEffect(style: blurStyle))
    }
    
    func updateUIView(_ uiView: UIVisualEffectView, context: Context) {
        uiView.effect = UIBlurEffect(style: blurStyle)
    }
}

#Preview {
    DiscoverView()
}
