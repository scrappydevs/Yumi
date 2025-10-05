//
//  aegisApp.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import SwiftUI

@main
struct aegisApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    // Handle OAuth callback
                    if url.scheme == "io.supabase.aegis" {
                        Task {
                            await AuthService.shared.handleOAuthCallback(url: url)
                        }
                    }
                }
        }
    }
}
