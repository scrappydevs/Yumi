//
//  ContentView.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import SwiftUI

struct ContentView: View {
    @ObservedObject private var authService = AuthService.shared

    var body: some View {
        Group {
            if authService.isAuthenticated {
                HomeView()
            } else {
                AuthView()
            }
        }
    }
}

#Preview {
    ContentView()
}
