//
//  NetworkService.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import Foundation
import UIKit

class NetworkService {
    static let shared = NetworkService()

    // Backend URL - Using ngrok tunnel to local backend
    private let baseURL = "https://unsliding-deena-unsportful.ngrok-free.dev"

    private init() {}

    // MARK: - Flexible Date Decoding Strategy
    private static let flexibleDateDecoding: JSONDecoder.DateDecodingStrategy = .custom { decoder in
        let container = try decoder.singleValueContainer()
        let dateString = try container.decode(String.self)

        // Try multiple date formats
        let formatters = [
            ISO8601DateFormatter(),
            {
                let formatter = ISO8601DateFormatter()
                formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                return formatter
            }()
        ]

        for formatter in formatters {
            if let date = formatter.date(from: dateString) {
                return date
            }
        }

        throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date: \(dateString)")
    }

    // MARK: - Step 1: Upload Image (AI analyzes in background, user doesn't see description)
    func uploadImage(
        image: UIImage, 
        location: String, 
        timestamp: Date, 
        latitude: Double?, 
        longitude: Double?, 
        authToken: String
    ) async throws -> ImageUploadResponse {
        let url = URL(string: "\(baseURL)/api/images/upload")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        // Create multipart body
        var body = Data()

        // Resize image to max 1024x1024 (saves ~70% upload/processing time)
        print("📸 [IMAGE RESIZE] Original size: \(image.size.width)×\(image.size.height)")
        let resizedImage = image.resizedForUpload(maxDimension: 1024)
        print("📸 [IMAGE RESIZE] Resized to: \(resizedImage.size.width)×\(resizedImage.size.height)")
        
        // Add image
        if let imageData = resizedImage.jpegData(compressionQuality: 0.8) {
            let sizeInKB = Double(imageData.count) / 1024.0
            print("📸 [IMAGE RESIZE] Final size: \(String(format: "%.1f", sizeInKB)) KB")
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"image\"; filename=\"food.jpg\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
            body.append(imageData)
            body.append("\r\n".data(using: .utf8)!)
        }

        // Add geolocation (string for display)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"geolocation\"\r\n\r\n".data(using: .utf8)!)
        body.append(location.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)

        // Add timestamp
        let isoFormatter = ISO8601DateFormatter()
        let timestampString = isoFormatter.string(from: timestamp)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"timestamp\"\r\n\r\n".data(using: .utf8)!)
        body.append(timestampString.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)

        // Add latitude (for restaurant matching)
        if let latitude = latitude {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"latitude\"\r\n\r\n".data(using: .utf8)!)
            body.append(String(latitude).data(using: .utf8)!)
            body.append("\r\n".data(using: .utf8)!)
        }

        // Add longitude (for restaurant matching)
        if let longitude = longitude {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"longitude\"\r\n\r\n".data(using: .utf8)!)
            body.append(String(longitude).data(using: .utf8)!)
            body.append("\r\n".data(using: .utf8)!)
        }

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body
        request.timeoutInterval = 30  // Claude API can be slow, allow 30s

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }

        let jsonResponse = try JSONDecoder().decode(ImageUploadResponse.self, from: data)
        return jsonResponse
    }

    // MARK: - Step 2: Submit Review (links to already-uploaded image)
    func submitReview(imageId: Int, userReview: String, restaurantName: String, rating: Int, authToken: String) async throws -> Review {
        let url = URL(string: "\(baseURL)/api/reviews/submit")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        // Create multipart body
        var body = Data()

        // Add image_id
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image_id\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(imageId)".data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add user_review (user's opinion)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"user_review\"\r\n\r\n".data(using: .utf8)!)
        body.append(userReview.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add restaurant_name
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"restaurant_name\"\r\n\r\n".data(using: .utf8)!)
        body.append(restaurantName.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add rating
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"rating\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(rating)".data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body
        request.timeoutInterval = 10

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = NetworkService.flexibleDateDecoding
        let review = try decoder.decode(Review.self, from: data)
        
        // Invalidate caches since new review affects both reviews and taste profile
        CacheService.shared.clearReviewsCache()
        CacheService.shared.clearTasteProfileCache()
        print("🔄 [CACHE] Invalidated reviews and taste profile cache after new review")
        
        return review
    }

    // MARK: - Fetch Image Data (for AI analysis results)
    func fetchImageData(imageId: Int, authToken: String) async throws -> FoodImage {
        let url = URL(string: "\(baseURL)/api/images/\(imageId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = NetworkService.flexibleDateDecoding
        let imageData = try decoder.decode(FoodImage.self, from: data)
        return imageData
    }

    // MARK: - Fetch User Reviews
    func fetchUserReviews(authToken: String, useCache: Bool = true) async throws -> [Review] {
        // Try loading from cache first
        if useCache, let cachedReviews = CacheService.shared.loadCachedReviews() {
            print("✅ [REVIEWS] Loaded from cache")
            return cachedReviews
        }
        
        print("🌐 [REVIEWS] Fetching from API...")
        let url = URL(string: "\(baseURL)/api/reviews")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = NetworkService.flexibleDateDecoding
        let reviews = try decoder.decode([Review].self, from: data)
        
        // Cache the results
        CacheService.shared.cacheReviews(reviews)
        
        return reviews
    }
    
    // MARK: - Fetch Food Graph
    func fetchFoodGraph(authToken: String, minSimilarity: Double = 0.5, useCache: Bool = true) async throws -> FoodGraphData {
        // Try loading from cache first
        if useCache, let cachedProfile = CacheService.shared.loadCachedTasteProfile() {
            print("✅ [TASTE PROFILE] Loaded from cache")
            return cachedProfile
        }
        
        print("🌐 [TASTE PROFILE] Fetching from API...")
        let url = URL(string: "\(baseURL)/api/food-graph?min_similarity=\(minSimilarity)")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 30  // Graph generation can take time

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = NetworkService.flexibleDateDecoding
        let graphData = try decoder.decode(FoodGraphData.self, from: data)
        
        // Cache the results
        CacheService.shared.cacheTasteProfile(graphData)
        
        return graphData
    }
    
    // MARK: - Friends Management
    
    // Fetch current user's profile
    func fetchMyProfile(authToken: String) async throws -> Profile {
        let url = URL(string: "\(baseURL)/api/profiles/me")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = NetworkService.flexibleDateDecoding
        let profile = try decoder.decode(Profile.self, from: data)
        return profile
    }
    
    // Fetch user's friends
    func fetchFriends(authToken: String) async throws -> [Profile] {
        let url = URL(string: "\(baseURL)/api/friends")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }

        // Debug: Print raw response
        if let jsonString = String(data: data, encoding: .utf8) {
            print("🔍 [FRIENDS] Raw response: \(jsonString)")
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = NetworkService.flexibleDateDecoding

        do {
            let friends = try decoder.decode([Profile].self, from: data)
            print("✅ [FRIENDS] Successfully decoded \(friends.count) friends")
            return friends
        } catch {
            print("❌ [FRIENDS] Decoding error: \(error)")
            throw error
        }
    }
    
    // Search for users by username
    func searchUsers(query: String, authToken: String) async throws -> [Profile] {
        guard !query.isEmpty else { return [] }
        
        let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        let url = URL(string: "\(baseURL)/api/users/search?q=\(encodedQuery)")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = NetworkService.flexibleDateDecoding
        let users = try decoder.decode([Profile].self, from: data)
        return users
    }
    
    // Add a friend
    func addFriend(friendId: UUID, authToken: String) async throws {
        let url = URL(string: "\(baseURL)/api/friends/add")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["friend_id": friendId.uuidString]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }
    }
    
    // Remove a friend
    func removeFriend(friendId: UUID, authToken: String) async throws {
        let url = URL(string: "\(baseURL)/api/friends/remove")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["friend_id": friendId.uuidString]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }
    }
    
    // Blend preferences with friends
    func blendPreferences(friendIds: [UUID], authToken: String) async throws -> BlendedPreferences {
        let url = URL(string: "\(baseURL)/api/preferences/blend")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["friend_ids": friendIds.map { $0.uuidString }]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        let blendedPreferences = try decoder.decode(BlendedPreferences.self, from: data)
        return blendedPreferences
    }
    
    // MARK: - Discover Restaurants
    func discoverRestaurants(
        latitude: Double,
        longitude: Double,
        authToken: String,
        useCache: Bool = true
    ) async throws -> DiscoverResponse {
        // Try loading from cache first (only if location hasn't changed significantly)
        if useCache, let cachedResponse = CacheService.shared.loadCachedDiscoverRestaurants() {
            // Check if cached location is close enough (within ~500m)
            let cachedLat = cachedResponse.location.latitude
            let cachedLon = cachedResponse.location.longitude
            let distance = haversineDistance(lat1: cachedLat, lon1: cachedLon, lat2: latitude, lon2: longitude)
            
            if distance < 500 { // Within 500 meters
                print("✅ [DISCOVER] Loaded from cache (location similar)")
                return cachedResponse
            } else {
                print("📍 [DISCOVER] Location changed (\(Int(distance))m), fetching fresh data")
            }
        }
        
        print("🌐 [DISCOVER] Fetching from API...")
        let url = URL(string: "\(baseURL)/api/restaurants/discover-ios")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add latitude
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"latitude\"\r\n\r\n".data(using: .utf8)!)
        body.append(String(latitude).data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add longitude
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"longitude\"\r\n\r\n".data(using: .utf8)!)
        body.append(String(longitude).data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        request.timeoutInterval = 45 // iOS-optimized: 10 candidates = faster (was 60s for 50 candidates)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            print("❌ [DISCOVER-iOS] Server error: \(httpResponse.statusCode)")
            if let responseText = String(data: data, encoding: .utf8) {
                print("❌ [DISCOVER-iOS] Response: \(responseText)")
            }
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        let discoverResponse = try decoder.decode(DiscoverResponse.self, from: data)
        print("✅ [DISCOVER-iOS] Received \(discoverResponse.restaurants.count) restaurants")
        
        // Cache the results
        CacheService.shared.cacheDiscoverRestaurants(discoverResponse)
        
        return discoverResponse
    }
    
    // MARK: - Haversine Distance Helper
    private func haversineDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double) -> Double {
        let R = 6371000.0 // Earth's radius in meters
        let dLat = (lat2 - lat1) * .pi / 180
        let dLon = (lon2 - lon1) * .pi / 180
        
        let a = sin(dLat/2) * sin(dLat/2) +
                cos(lat1 * .pi / 180) * cos(lat2 * .pi / 180) *
                sin(dLon/2) * sin(dLon/2)
        let c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c
    }
    
    // MARK: - Search Restaurants
    func searchRestaurants(
        query: String,
        latitude: Double,
        longitude: Double,
        authToken: String
    ) async throws -> DiscoverResponse {
        let url = URL(string: "\(baseURL)/api/restaurants/search-ios")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add query
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"query\"\r\n\r\n".data(using: .utf8)!)
        body.append(query.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add latitude
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"latitude\"\r\n\r\n".data(using: .utf8)!)
        body.append(String(latitude).data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add longitude
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"longitude\"\r\n\r\n".data(using: .utf8)!)
        body.append(String(longitude).data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        request.timeoutInterval = 60 // iOS-optimized: 10 candidates = faster (was 80s for 50 candidates)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            print("❌ [SEARCH-iOS] Server error: \(httpResponse.statusCode)")
            if let responseText = String(data: data, encoding: .utf8) {
                print("❌ [SEARCH-iOS] Response: \(responseText)")
            }
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }
        
        // Debug: Print the actual JSON response
        if let responseText = String(data: data, encoding: .utf8) {
            print("🔍 [SEARCH-iOS DEBUG] Raw JSON response:")
            print(responseText.prefix(500)) // First 500 chars
        }
        
        let decoder = JSONDecoder()
        
        // The search endpoint returns top_restaurants instead of restaurants
        struct SearchResponse: Codable {
            let status: String
            let topRestaurants: [Restaurant]
            let reasoning: String?
            let location: LocationCoordinates
            
            enum CodingKeys: String, CodingKey {
                case status
                case topRestaurants = "top_restaurants"
                case reasoning
                case location
            }
        }
        
        do {
            let searchResponse = try decoder.decode(SearchResponse.self, from: data)
            print("✅ [SEARCH-iOS] Successfully decoded response")
            return DiscoverResponse(
                status: searchResponse.status,
                restaurants: searchResponse.topRestaurants,
                reasoning: searchResponse.reasoning,
                location: searchResponse.location
            )
        } catch {
            print("❌ [SEARCH-iOS DECODE ERROR] Failed to decode: \(error)")
            if let decodingError = error as? DecodingError {
                switch decodingError {
                case .keyNotFound(let key, let context):
                    print("❌ [SEARCH-iOS] Missing key: \(key.stringValue)")
                    print("❌ [SEARCH-iOS] Context: \(context.debugDescription)")
                case .typeMismatch(let type, let context):
                    print("❌ [SEARCH-iOS] Type mismatch for type: \(type)")
                    print("❌ [SEARCH-iOS] Context: \(context.debugDescription)")
                case .valueNotFound(let type, let context):
                    print("❌ [SEARCH-iOS] Value not found for type: \(type)")
                    print("❌ [SEARCH-iOS] Context: \(context.debugDescription)")
                case .dataCorrupted(let context):
                    print("❌ [SEARCH-iOS] Data corrupted: \(context.debugDescription)")
                @unknown default:
                    print("❌ [SEARCH-iOS] Unknown decoding error")
                }
            }
            throw error
        }
    }
}

// MARK: - Response Models
struct ImageUploadResponse: Codable {
    let imageId: Int
    let imageURL: String
    
    enum CodingKeys: String, CodingKey {
        case imageId = "image_id"
        case imageURL = "image_url"
    }
}

// MARK: - Network Errors
enum NetworkError: Error {
    case invalidResponse
    case serverError(statusCode: Int)
    case decodingError
}
