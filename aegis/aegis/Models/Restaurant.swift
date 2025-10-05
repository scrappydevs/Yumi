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
    
    // Custom decoder to handle price_level as either String or Int
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        placeId = try container.decode(String.self, forKey: .placeId)
        name = try container.decode(String.self, forKey: .name)
        cuisine = try container.decodeIfPresent(String.self, forKey: .cuisine)
        distanceMeters = try container.decodeIfPresent(Double.self, forKey: .distanceMeters)
        rating = try container.decodeIfPresent(Double.self, forKey: .rating)
        address = try container.decodeIfPresent(String.self, forKey: .address)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        atmosphere = try container.decodeIfPresent(String.self, forKey: .atmosphere)
        matchScore = try container.decodeIfPresent(Double.self, forKey: .matchScore)
        reasoning = try container.decodeIfPresent(String.self, forKey: .reasoning)
        
        // Handle price_level as either String or Int
        if let priceLevelInt = try? container.decodeIfPresent(Int.self, forKey: .priceLevel) {
            priceLevel = priceLevelInt
        } else if let priceLevelString = try? container.decodeIfPresent(String.self, forKey: .priceLevel) {
            priceLevel = Int(priceLevelString)
        } else {
            priceLevel = nil
        }
    }
}

// MARK: - Location Coordinates
struct LocationCoordinates: Codable {
    let latitude: Double
    let longitude: Double
}
