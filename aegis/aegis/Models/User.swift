//
//  User.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import Foundation

struct User: Codable {
    let id: UUID
    let email: String
}

// Profile model matching the database schema
struct Profile: Codable, Identifiable {
    let id: UUID
    let username: String
    let displayName: String?
    let avatarUrl: String?
    let bio: String?
    let friends: [UUID]?
    let preferences: String?
    let createdAt: Date
    let updatedAt: Date
    let phone: String?
    let phoneVerified: Bool?
    let onboarded: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id
        case username
        case displayName = "display_name"
        case avatarUrl = "avatar_url"
        case bio
        case friends
        case preferences
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case phone
        case phoneVerified = "phone_verified"
        case onboarded
    }
    
    var displayNameOrUsername: String {
        displayName ?? username
    }
}
