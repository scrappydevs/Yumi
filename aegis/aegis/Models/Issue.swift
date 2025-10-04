//
//  Issue.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import Foundation

enum IssueStatus: String, Codable {
    case incomplete
    case complete
    
    // Helper computed properties for display
    var displayName: String {
        switch self {
        case .incomplete: return "In Progress"
        case .complete: return "Resolved"
        }
    }
    
    var displayColor: String {
        switch self {
        case .incomplete: return "orange"
        case .complete: return "green"
        }
    }
}

struct Issue: Identifiable, Codable {
    let id: UUID
    let imageURL: String?
    let description: String?
    let geolocation: String?
    let timestamp: Date
    let status: IssueStatus?
    let uid: UUID?
    
    enum CodingKeys: String, CodingKey {
        case id
        case imageURL = "image_url"  // Backend returns image_url with the storage URL
        case description
        case geolocation
        case timestamp
        case status
        case uid = "user_id"  // Backend uses user_id, maps to uid
    }
}

struct IssueSubmissionRequest {
    let imageData: Data
    let description: String
    let geolocation: String
    let timestamp: Date
}
