//
//  Review.swift
//  aegis
//
//  Models for food reviews matching the database schema
//

import Foundation

// MARK: - Food Image Model (from images table)
struct FoodImage: Identifiable, Codable {
    let id: Int
    let description: String  // AI-generated food description
    let imageURL: String?
    let timestamp: Date?
    let geolocation: String?
    let dish: String?           // AI-generated dish name
    let cuisine: String?        // AI-generated cuisine type
    let suggestedRestaurant: String?  // AI-suggested restaurant (from cache, not DB)
    
    enum CodingKeys: String, CodingKey {
        case id
        case description
        case imageURL = "image_url"
        case timestamp
        case geolocation
        case dish
        case cuisine
        case suggestedRestaurant = "suggested_restaurant"
    }
}

// MARK: - Review Model (from reviews table)
struct Review: Identifiable, Codable {
    let id: UUID
    let imageId: Int?
    let description: String?  // User's review
    let uid: UUID?
    let overallRating: Int?
    let restaurantName: String?
    
    // Nested image data (when joined)
    let images: FoodImage?
    
    enum CodingKeys: String, CodingKey {
        case id
        case imageId = "image_id"
        case description
        case uid
        case overallRating = "overall_rating"
        case restaurantName = "restaurant_name"
        case images
    }
    
    // Convenience computed properties
    var rating: Int {
        return overallRating ?? 0
    }
    
    var imageURL: String? {
        return images?.imageURL
    }
    
    var foodDescription: String {
        return images?.description ?? "No description"
    }
    
    var userReview: String {
        return description ?? "No review"
    }
    
    var timestamp: Date {
        return images?.timestamp ?? Date()
    }
    
    var location: String {
        return images?.geolocation ?? "Unknown location"
    }
    
    var dish: String {
        return images?.dish ?? "Unknown Dish"
    }
    
    var cuisine: String {
        return images?.cuisine ?? "Unknown"
    }
}

// MARK: - Review Submission Request
struct ReviewSubmissionRequest {
    let imageData: Data
    let foodDescription: String      // AI-generated
    let userReview: String           // User's opinion
    let restaurantName: String
    let rating: Int                  // 1-5 stars
    let geolocation: String
    let timestamp: Date
}

