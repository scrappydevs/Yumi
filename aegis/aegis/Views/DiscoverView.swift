//
//  DiscoverView.swift
//  aegis
//
//  Discover personalized restaurant recommendations
//

import SwiftUI

struct DiscoverView: View {
    @State private var restaurants: [Restaurant] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var reasoning: String = ""
    
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
            errorMessage = "Failed to load recommendations: \(error.localizedDescription)"
            print("❌ [DISCOVER] Error: \(error)")
        }
        
        isLoading = false
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

#Preview {
    DiscoverView()
}
