//
//  FriendsView.swift
//  aegis
//
//  Friends list and search view
//

import SwiftUI

struct FriendsView: View {
    @StateObject private var viewModel = FriendsViewModel()
    @State private var showingSearch = false
    
    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading && viewModel.friends.isEmpty {
                    ProgressView("Loading friends...")
                } else if viewModel.friends.isEmpty {
                    emptyStateView
                } else {
                    friendsListView
                }
            }
            .navigationTitle("Friends")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingSearch = true }) {
                        Image(systemName: "person.badge.plus")
                    }
                }
            }
            .sheet(isPresented: $showingSearch) {
                SearchUsersView(viewModel: viewModel)
            }
            .task {
                await viewModel.loadMyProfile()
                await viewModel.loadFriends()
            }
            .refreshable {
                await viewModel.loadFriends()
            }
            .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("OK") {
                    viewModel.errorMessage = nil
                }
            } message: {
                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                }
            }
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.2.slash")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No Friends Yet")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Start adding friends to share your food experiences!")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            Button(action: { showingSearch = true }) {
                Label("Find Friends", systemImage: "person.badge.plus")
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
    }
    
    private var friendsListView: some View {
        List {
            ForEach(viewModel.friends) { friend in
                FriendRowView(profile: friend, viewModel: viewModel)
            }
        }
        .listStyle(.plain)
    }
}

struct FriendRowView: View {
    let profile: Profile
    @ObservedObject var viewModel: FriendsViewModel
    @State private var showingConfirmation = false
    
    var body: some View {
        HStack(spacing: 15) {
            // Avatar
            if let avatarUrl = profile.avatarUrl, !avatarUrl.isEmpty {
                AsyncImage(url: URL(string: avatarUrl)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    defaultAvatar
                }
                .frame(width: 50, height: 50)
                .clipShape(Circle())
            } else {
                defaultAvatar
            }
            
            // User info
            VStack(alignment: .leading, spacing: 4) {
                Text(profile.displayNameOrUsername)
                    .font(.headline)
                
                Text("@\(profile.username)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if let bio = profile.bio, !bio.isEmpty {
                    Text(bio)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            // Remove friend button
            Button(action: { showingConfirmation = true }) {
                Image(systemName: "person.fill.xmark")
                    .foregroundColor(.red)
            }
            .buttonStyle(.borderless)
        }
        .padding(.vertical, 8)
        .confirmationDialog("Remove Friend", isPresented: $showingConfirmation) {
            Button("Remove Friend", role: .destructive) {
                Task {
                    await viewModel.removeFriend(profile)
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to remove @\(profile.username) from your friends?")
        }
    }
    
    private var defaultAvatar: some View {
        Circle()
            .fill(Color.blue.opacity(0.2))
            .frame(width: 50, height: 50)
            .overlay(
                Text(profile.username.prefix(1).uppercased())
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)
            )
    }
}

struct SearchUsersView: View {
    @ObservedObject var viewModel: FriendsViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    
                    TextField("Search by username", text: $viewModel.searchQuery)
                        .textFieldStyle(.plain)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    
                    if !viewModel.searchQuery.isEmpty {
                        Button(action: { viewModel.searchQuery = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding()
                
                // Search results
                if viewModel.searchQuery.isEmpty {
                    Spacer()
                    Text("Search for users by username")
                        .foregroundColor(.secondary)
                    Spacer()
                } else if viewModel.searchResults.isEmpty {
                    Spacer()
                    Text("No users found")
                        .foregroundColor(.secondary)
                    Spacer()
                } else {
                    List {
                        ForEach(viewModel.searchResults) { user in
                            SearchResultRow(profile: user, viewModel: viewModel)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Find Friends")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct SearchResultRow: View {
    let profile: Profile
    @ObservedObject var viewModel: FriendsViewModel
    
    var body: some View {
        HStack(spacing: 15) {
            // Avatar
            if let avatarUrl = profile.avatarUrl, !avatarUrl.isEmpty {
                AsyncImage(url: URL(string: avatarUrl)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    defaultAvatar
                }
                .frame(width: 50, height: 50)
                .clipShape(Circle())
            } else {
                defaultAvatar
            }
            
            // User info
            VStack(alignment: .leading, spacing: 4) {
                Text(profile.displayNameOrUsername)
                    .font(.headline)
                
                Text("@\(profile.username)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if let bio = profile.bio, !bio.isEmpty {
                    Text(bio)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
            }
            
            Spacer()
            
            // Add/Remove friend button
            if viewModel.isFriend(profile) {
                Button(action: {
                    Task {
                        await viewModel.removeFriend(profile)
                    }
                }) {
                    Text("Friends")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.green)
                        .cornerRadius(8)
                }
                .buttonStyle(.borderless)
            } else if profile.id == viewModel.myProfile?.id {
                Text("You")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
            } else {
                Button(action: {
                    Task {
                        await viewModel.addFriend(profile)
                    }
                }) {
                    Text("Add")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue)
                        .cornerRadius(8)
                }
                .buttonStyle(.borderless)
            }
        }
        .padding(.vertical, 8)
    }
    
    private var defaultAvatar: some View {
        Circle()
            .fill(Color.blue.opacity(0.2))
            .frame(width: 50, height: 50)
            .overlay(
                Text(profile.username.prefix(1).uppercased())
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)
            )
    }
}

#Preview {
    FriendsView()
}
