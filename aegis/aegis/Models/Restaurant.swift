//
//  Restaurant.swift
//  aegis
//
//  Models for Discover feature - restaurant recommendations
//

import Foundation

// MARK: - Discover Response
struct DiscoverResponse: Codable {
    let status: String
    let restaurants: [Restaurant]
    let reasoning: String?
    let location: LocationCoordinates
}

// MARK: - Restaurant
struct Restaurant: Codable, Identifiable {
    let placeId: String
    let name: String
    let cuisine: String?
    let distanceMeters: Double?
    let rating: Double?
    let address: String?
    let description: String?
    let atmosphere: String?
    let priceLevel: Int?
    let matchScore: Double?
    let reasoning: String?
    
    // Computed property for Identifiable protocol
    var id: String { placeId }
    
    // Computed property for display distance
    var distance: String? {
        guard let meters = distanceMeters else { return nil }
        if meters < 1000 {
            return String(format: "%.0fm", meters)
        } else {
            return String(format: "%.1fkm", meters / 1000)
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case placeId = "place_id"
        case name
        case cuisine
        case distanceMeters = "distance_meters"
        case rating
        case address
        case description
        case atmosphere
        case priceLevel = "price_level"
        case matchScore = "match_score"
        case reasoning
    }
}

// MARK: - Location Coordinates
struct LocationCoordinates: Codable {
    let latitude: Double
    let longitude: Double
}
