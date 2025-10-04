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
    @Published var blendedPreferences: BlendedPreferences?
    @Published var isBlending: Bool = false
    
    private let networkService = NetworkService.shared
    private let authService = AuthService.shared
    private var searchTask: Task<Void, Never>?
    private var loadTask: Task<Void, Never>?
    
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
    
    func loadData() async {
        print("🔄 [FRIENDS VM] loadData() called")

        // Cancel any existing load task
        loadTask?.cancel()

        // Create new load task
        loadTask = Task {
            guard let authToken = authService.getAuthToken() else {
                print("❌ [FRIENDS VM] No auth token")
                errorMessage = "Not authenticated"
                return
            }

            print("🔄 [FRIENDS VM] Starting data load...")
            isLoading = true
            errorMessage = nil

            do {
                // Load profile and friends concurrently
                async let profileResult = networkService.fetchMyProfile(authToken: authToken)
                async let friendsResult = networkService.fetchFriends(authToken: authToken)

                let (profile, friendsList) = try await (profileResult, friendsResult)

                if !Task.isCancelled {
                    print("✅ [FRIENDS VM] Received profile: \(profile.username)")
                    print("✅ [FRIENDS VM] Received \(friendsList.count) friends")
                    myProfile = profile
                    friends = friendsList
                    print("✅ [FRIENDS VM] State updated - friends.count = \(friends.count)")
                }
            } catch {
                if !Task.isCancelled {
                    print("❌ [FRIENDS VM] Load error: \(error)")
                    errorMessage = "Failed to load data: \(error.localizedDescription)"
                }
            }

            isLoading = false
            print("🔄 [FRIENDS VM] loadData() completed")
        }

        await loadTask?.value
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
            await loadData() // Refresh both profile and friends
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
            await loadData() // Refresh both profile and friends
        } catch {
            errorMessage = "Failed to remove friend: \(error.localizedDescription)"
        }
    }
    
    func isFriend(_ profile: Profile) -> Bool {
        guard let myProfile = myProfile else { return false }
        return myProfile.friends?.contains(profile.id) ?? false
    }
    
    func blendPreferences(with selectedFriends: [Profile] = []) async {
        guard let authToken = authService.getAuthToken() else {
            errorMessage = "Not authenticated"
            return
        }
        
        // If no friends selected, use all friends
        let friendIds = selectedFriends.isEmpty 
            ? friends.map { $0.id }
            : selectedFriends.map { $0.id }
        
        if friendIds.isEmpty {
            errorMessage = "Add some friends first to blend preferences!"
            return
        }
        
        isBlending = true
        errorMessage = nil
        
        do {
            blendedPreferences = try await networkService.blendPreferences(
                friendIds: friendIds,
                authToken: authToken
            )
        } catch {
            errorMessage = "Failed to blend preferences: \(error.localizedDescription)"
            blendedPreferences = nil
        }
        
        isBlending = false
    }
}
