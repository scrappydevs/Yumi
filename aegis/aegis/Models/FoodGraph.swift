//
//  FoodGraph.swift
//  aegis
//
//  Models for food similarity graph visualization
//

import Foundation

// MARK: - Food Node (represents a food item in the graph)
struct FoodNode: Identifiable, Codable, Equatable {
    let id: Int
    let dish: String
    let cuisine: String
    let restaurant: String?  // Optional - some reviews might not have restaurant
    let rating: Int?         // Optional - can be 0 or null
    let imageURL: String?    // Optional - image might be missing
    let description: String
    let timestamp: String?   // Optional - might be missing
    
    enum CodingKeys: String, CodingKey {
        case id
        case dish
        case cuisine
        case restaurant
        case rating
        case imageURL = "image_url"
        case description
        case timestamp
    }
    
    // Convenience computed properties with defaults
    var restaurantName: String {
        restaurant ?? "Unknown Restaurant"
    }
    
    var starRating: Int {
        rating ?? 0
    }
    
    // Equatable conformance (automatic for structs, but explicit for clarity)
    static func == (lhs: FoodNode, rhs: FoodNode) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Graph Edge (represents similarity between two foods)
struct GraphEdge: Identifiable, Codable {
    var id: String {
        "\(source)-\(target)"
    }
    
    let source: Int
    let target: Int
    let weight: Double  // Similarity score (0.0 - 1.0)
}

// MARK: - Food Graph Data (complete graph structure)
struct FoodGraphData: Codable {
    let nodes: [FoodNode]
    let edges: [GraphEdge]
    let stats: GraphStats?
    
    struct GraphStats: Codable {
        let totalFoods: Int
        let totalConnections: Int
        let minSimilarity: Double
        
        enum CodingKeys: String, CodingKey {
            case totalFoods = "total_foods"
            case totalConnections = "total_connections"
            case minSimilarity = "min_similarity"
        }
    }
}

// MARK: - Node Position (for graph layout)
struct NodePosition: Identifiable {
    let id: Int
    var x: CGFloat
    var y: CGFloat
    var vx: CGFloat = 0  // Velocity x
    var vy: CGFloat = 0  // Velocity y
}

