//
//  MainTabView.swift
//  aegis
//
//  Main tab bar navigation with Reviews and Taste Profile
//

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Tab 1: My Reviews
            HomeView()
                .tabItem {
                    Label("Reviews", systemImage: "fork.knife")
                }
                .tag(0)
            
            // Tab 2: Friends
            FriendsView()
                .tabItem {
                    Label("Friends", systemImage: "person.2.fill")
                }
                .tag(1)
            
            // Tab 3: Taste Profile
            NavigationView {
                TasteProfileView()
            }
            .tabItem {
                Label("Taste Profile", systemImage: "chart.pie")
            }
            .tag(2)
        }
        .accentColor(.blue)
    }
}

#Preview {
    MainTabView()
}

