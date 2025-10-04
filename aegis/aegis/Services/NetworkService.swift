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
    private let baseURL = "http://172.26.24.39:8000"

    private init() {}

    // MARK: - Step 1: Analyze Image with AI
    func analyzeImage(image: UIImage, location: String, timestamp: Date, authToken: String) async throws -> String {
        let url = URL(string: "\(baseURL)/api/analyze-image")!
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
            body.append("Content-Disposition: form-data; name=\"image\"; filename=\"issue.jpg\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
            body.append(imageData)
            body.append("\r\n".data(using: .utf8)!)
        }

        // Add geolocation
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

        let jsonResponse = try JSONDecoder().decode(AIAnalysisResponse.self, from: data)
        return jsonResponse.description
    }

    // MARK: - Step 2: Submit Final Issue
    func submitIssue(image: UIImage, description: String, location: String, timestamp: Date, authToken: String) async throws -> Issue {
        let url = URL(string: "\(baseURL)/api/issues/submit")!
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
            body.append("Content-Disposition: form-data; name=\"image\"; filename=\"issue.jpg\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
            body.append(imageData)
            body.append("\r\n".data(using: .utf8)!)
        }

        // Add description
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"description\"\r\n\r\n".data(using: .utf8)!)
        body.append(description.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)

        // Add geolocation
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

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body
        request.timeoutInterval = 30  // Allow time for image upload

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let issue = try decoder.decode(Issue.self, from: data)
        return issue
    }

    // MARK: - Fetch User Issues
    func fetchUserIssues(authToken: String) async throws -> [Issue] {
        let url = URL(string: "\(baseURL)/api/issues")!
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
        let issues = try decoder.decode([Issue].self, from: data)
        return issues
    }
}

// MARK: - Response Models
struct AIAnalysisResponse: Codable {
    let description: String
}

// MARK: - Network Errors
enum NetworkError: Error {
    case invalidResponse
    case serverError(statusCode: Int)
    case decodingError
}
