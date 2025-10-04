//
//  FriendsViewModel.swift
//  aegis
//
//  Manages friends list and friend operations
//

import Foundation
import Combine

@MainActor
class FriendsViewModel: ObservableObject {
    @Published var friends: [Profile] = []
    @Published var searchResults: [Profile] = []
    @Published var searchQuery: String = ""
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var myProfile: Profile?
    
    private let networkService = NetworkService.shared
    private let authService = AuthService.shared
    private var searchTask: Task<Void, Never>?
    
    init() {
        // Set up search debouncing
        Task {
            for await query in $searchQuery.values {
                searchTask?.cancel()
                searchTask = Task {
                    try? await Task.sleep(nanoseconds: 300_000_000) // 300ms debounce
                    if !Task.isCancelled {
                        await performSearch(query: query)
                    }
                }
            }
        }
    }
    
    func loadMyProfile() async {
        guard let authToken = authService.getAuthToken() else {
            errorMessage = "Not authenticated"
            return
        }
        
        do {
            myProfile = try await networkService.fetchMyProfile(authToken: authToken)
        } catch {
            errorMessage = "Failed to load profile: \(error.localizedDescription)"
        }
    }
    
    func loadFriends() async {
        guard let authToken = authService.getAuthToken() else {
            errorMessage = "Not authenticated"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        do {
            friends = try await networkService.fetchFriends(authToken: authToken)
        } catch {
            errorMessage = "Failed to load friends: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    private func performSearch(query: String) async {
        guard let authToken = authService.getAuthToken() else { return }
        
        if query.isEmpty {
            searchResults = []
            return
        }
        
        do {
            searchResults = try await networkService.searchUsers(query: query, authToken: authToken)
        } catch {
            errorMessage = "Search failed: \(error.localizedDescription)"
        }
    }
    
    func addFriend(_ profile: Profile) async {
        guard let authToken = authService.getAuthToken() else {
            errorMessage = "Not authenticated"
            return
        }
        
        do {
            try await networkService.addFriend(friendId: profile.id, authToken: authToken)
            await loadFriends() // Refresh friends list
            await loadMyProfile() // Refresh profile
        } catch {
            errorMessage = "Failed to add friend: \(error.localizedDescription)"
        }
    }
    
    func removeFriend(_ profile: Profile) async {
        guard let authToken = authService.getAuthToken() else {
            errorMessage = "Not authenticated"
            return
        }
        
        do {
            try await networkService.removeFriend(friendId: profile.id, authToken: authToken)
            await loadFriends() // Refresh friends list
            await loadMyProfile() // Refresh profile
        } catch {
            errorMessage = "Failed to remove friend: \(error.localizedDescription)"
        }
    }
    
    func isFriend(_ profile: Profile) -> Bool {
        guard let myProfile = myProfile else { return false }
        return myProfile.friends?.contains(profile.id) ?? false
    }
}
