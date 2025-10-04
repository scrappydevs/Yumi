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

    // Backend URL - Physical iPhone connects to Mac's current WiFi IP
    // IMPORTANT: Update this if your Mac's IP changes
    private let baseURL = "http://10.253.26.187:8000"

    private init() {}

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

        // Add image
        if let imageData = image.jpegData(compressionQuality: 0.8) {
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
        decoder.dateDecodingStrategy = .iso8601
        let review = try decoder.decode(Review.self, from: data)
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
        decoder.dateDecodingStrategy = .iso8601
        let imageData = try decoder.decode(FoodImage.self, from: data)
        return imageData
    }

    // MARK: - Fetch User Reviews
    func fetchUserReviews(authToken: String) async throws -> [Review] {
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
        decoder.dateDecodingStrategy = .iso8601
        let reviews = try decoder.decode([Review].self, from: data)
        return reviews
    }
    
    // MARK: - Fetch Food Graph
    func fetchFoodGraph(authToken: String, minSimilarity: Double = 0.5) async throws -> FoodGraphData {
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
        decoder.dateDecodingStrategy = .iso8601
        let graphData = try decoder.decode(FoodGraphData.self, from: data)
        return graphData
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
