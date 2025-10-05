//
//  AuthService.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import Foundation
import Supabase
import Auth

enum AuthError: Error, LocalizedError {
    case oauthConflict
    
    var errorDescription: String? {
        switch self {
        case .oauthConflict:
            return "This email is already linked to Google. Please use 'Continue with Google' or contact support."
        }
    }
}

@MainActor
class AuthService: ObservableObject {
    static let shared = AuthService()

    @Published var user: User?
    @Published var session: Session?

    // TODO: Add your Supabase URL and Anon Key
    private let supabaseURL = URL(string: "https://ocwyjzrgxgpfwruobjfh.supabase.co")!
    private let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jd3lqenJneGdwZndydW9iamZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzMxMTMsImV4cCI6MjA3NDk0OTExM30.i4PIbQJ0J6ps3lrU8wtedoG4TaBL6pw3oE4K0UDEzcQ"

    private var client: SupabaseClient

    var isAuthenticated: Bool {
        session != nil
    }

    private init() {
        client = SupabaseClient(supabaseURL: supabaseURL, supabaseKey: supabaseKey)

        Task {
            await checkSession()
        }
    }

    func checkSession() async {
        do {
            let session = try await client.auth.session
            self.session = session
            if let userEmail = session.user.email {
                self.user = User(id: session.user.id, email: userEmail)
            }
        } catch {
            print("No active session: \(error)")
        }
    }

    func signIn(email: String, password: String) async throws {
        do {
            let session = try await client.auth.signIn(email: email, password: password)
            self.session = session
            if let userEmail = session.user.email {
                self.user = User(id: session.user.id, email: userEmail)
            }
        } catch {
            print("❌ [AUTH] Sign in error: \(error)")
            // Check if it's an OAuth conflict
            if error.localizedDescription.contains("Email already registered") || 
               error.localizedDescription.contains("User already registered") {
                throw AuthError.oauthConflict
            }
            throw error
        }
    }

    func signUp(email: String, password: String) async throws {
        let response = try await client.auth.signUp(email: email, password: password)
        self.session = response.session
        if let session = response.session, let userEmail = session.user.email {
            self.user = User(id: session.user.id, email: userEmail)
        }
    }

    func signOut() async throws {
        try await client.auth.signOut()
        self.session = nil
        self.user = nil
    }

    func getAuthToken() -> String? {
        return session?.accessToken
    }
    
    // MARK: - OAuth Sign In (for MVP - matches web)
    func signInWithOAuth() async throws {
        // Web-based OAuth - opens Safari, user signs in, redirects back to app
        let session = try await client.auth.signInWithOAuth(
            provider: .google,
            redirectTo: URL(string: "io.supabase.aegis://auth-callback")
        )
        print("🌐 [AUTH] OAuth flow initiated - should open Safari")
        // Note: OAuth completion handled by URL scheme in aegisApp.swift
    }
    
    // Handle OAuth callback from URL
    func handleOAuthCallback(url: URL) async {
        do {
            let session = try await client.auth.session(from: url)
            self.session = session
            if let userEmail = session.user.email {
                self.user = User(id: session.user.id, email: userEmail)
            }
            print("✅ [AUTH] OAuth sign in successful")
        } catch {
            print("❌ [AUTH] OAuth callback error: \(error)")
        }
    }
}
