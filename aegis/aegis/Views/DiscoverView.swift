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
                    // Pull-to-refresh action - bypass cache for fresh data
                    await loadRecommendations(bypassCache: true)
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
    
    private func loadRecommendations(bypassCache: Bool = false) async {
        isLoading = true
        errorMessage = nil
        
        do {
            print("🌟 [DISCOVER-iOS] Starting to load recommendations (iOS-optimized)...")
            
            // Get user's location
            let locationString = try await LocationService.shared.getCurrentLocation()
            print("📍 [DISCOVER-iOS] Location: \(locationString)")
            
            let coords = locationString.split(separator: ",")
            guard coords.count == 2,
                  let latitude = Double(coords[0]),
                  let longitude = Double(coords[1]) else {
                print("❌ [DISCOVER-iOS] Invalid location format")
                throw NSError(domain: "Invalid location", code: -1)
            }
            
            // Get auth token
            guard let token = await AuthService.shared.getAuthToken() else {
                print("❌ [DISCOVER-iOS] No auth token")
                throw NSError(domain: "Not authenticated", code: 401)
            }
            
            print("🔑 [DISCOVER-iOS] Got auth token, calling iOS-optimized API...")
            
            // Fetch recommendations (using iOS-optimized endpoint with 10 candidates)
            let response = try await NetworkService.shared.discoverRestaurants(
                latitude: latitude,
                longitude: longitude,
                authToken: token,
                useCache: !bypassCache
            )
            
            print("✅ [DISCOVER-iOS] Got \(response.restaurants.count) restaurants \(bypassCache ? "(fresh)" : "(cached or fresh)")")
            
            restaurants = response.restaurants
            reasoning = response.reasoning ?? ""
            
        } catch {
            // Don't call onLoaded on cancellation (view was dismissed)
            if (error as NSError).code == NSURLErrorCancelled || 
               String(describing: error).contains("CancellationError") {
                print("⚠️ [DISCOVER-iOS] Task cancelled, not calling onLoaded")
                return
            }
            
            errorMessage = "Failed to load recommendations: \(error.localizedDescription)"
            print("❌ [DISCOVER-iOS] Error: \(error)")
        }
        
        isLoading = false
        
        // Call onLoaded callback once (even if there was an error)
        if !hasCalledOnLoaded {
            hasCalledOnLoaded = true
            onLoaded?()
            print("🎯 [DISCOVER-iOS] Called onLoaded callback")
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
            print("🔍 [SEARCH-iOS] Starting iOS-optimized search for: '\(searchQuery)'")
            
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
            
            print("🔍 [SEARCH-iOS] Calling iOS-optimized search API (10 candidates)...")
            
            // Call iOS-optimized search endpoint
            let response = try await NetworkService.shared.searchRestaurants(
                query: searchQuery,
                latitude: latitude,
                longitude: longitude,
                authToken: token
            )
            
            print("✅ [SEARCH-iOS] Got \(response.restaurants.count) results")
            searchResults = response.restaurants
            
        } catch {
            searchError = "Search failed: \(error.localizedDescription)"
            print("❌ [SEARCH-iOS] Error: \(error)")
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
            // Light gradient background matching app design
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.95, green: 0.96, blue: 0.98),
                    Color(red: 0.98, green: 0.95, blue: 0.98)
                ]),
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
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 28, weight: .medium))
                            .foregroundColor(.secondary)
                            .symbolRenderingMode(.hierarchical)
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
                                    ProgressView()
                                        .scaleEffect(1.5)
                                        .tint(.blue)
                                    
                                    Text("Searching for restaurants...")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.top, 80)
                                .frame(maxWidth: .infinity)
                            }
                            else if let error = searchError {
                                VStack(spacing: 16) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .font(.system(size: 50))
                                        .foregroundColor(.orange)
                                    Text(error)
                                        .font(.body)
                                        .foregroundColor(.secondary)
                                        .multilineTextAlignment(.center)
                                        .padding(.horizontal, 32)
                                    
                                    Button("Try Again") {
                                        Task { await onSearch() }
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(.blue)
                                }
                                .padding(.top, 60)
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
                    // Empty state - clean Apple design
                    VStack(spacing: 32) {
                    Spacer()

                        // Icon
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 60))
                            .foregroundColor(.blue)
                            .padding(.bottom, 8)

                        VStack(spacing: 12) {
                            Text("Search for Restaurants")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)

                            Text("Find amazing places to eat with AI")
                                .font(.body)
                                .foregroundColor(.secondary)
                        }

                        // Suggestions
                        VStack(spacing: 12) {
                            Text("Try searching for:")
                                .font(.subheadline)
                                .foregroundColor(.secondary)

                            HStack(spacing: 10) {
                                ForEach(["Italian", "Sushi", "Pizza"], id: \.self) { suggestion in
                                    Button {
                                            searchQuery = suggestion
                                            Task { await onSearch() }
                                    } label: {
                                        Text(suggestion)
                                            .font(.subheadline)
                                            .fontWeight(.medium)
                                            .foregroundColor(.blue)
                                            .padding(.horizontal, 16)
                                            .padding(.vertical, 10)
                                            .background(Color.white)
                                            .cornerRadius(20)
                                            .shadow(color: .black.opacity(0.08), radius: 4, y: 2)
                                    }
                                }
                            }
                        }
                        
                        Spacer()
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, 32)
                }

                // Clean search bar
                HStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(isSearchFocused.wrappedValue ? .blue : .secondary)

                    TextField("", text: $searchQuery, prompt: Text("Search for restaurants...")
                        .foregroundColor(.secondary))
                        .focused(isSearchFocused)
                        .foregroundColor(.primary)
                        .onSubmit {
                            Task { await onSearch() }
                        }
                        .submitLabel(.search)

                    if !searchQuery.isEmpty {
                        Button {
                            searchQuery = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                                .font(.system(size: 18))
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.white)
                        .shadow(
                            color: isSearchFocused.wrappedValue ?
                                Color.blue.opacity(0.2) : Color.black.opacity(0.08),
                            radius: isSearchFocused.wrappedValue ? 12 : 4,
                            y: isSearchFocused.wrappedValue ? 4 : 2
                        )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(
                            isSearchFocused.wrappedValue ? Color.blue : Color.clear,
                            lineWidth: isSearchFocused.wrappedValue ? 2 : 0
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
