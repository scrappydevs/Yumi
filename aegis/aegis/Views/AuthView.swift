//
//  AuthView.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import SwiftUI

struct AuthView: View {
    @ObservedObject private var authService = AuthService.shared
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            // App Title
            Text("Yummy")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Discover Great Food")
                .font(.subheadline)
                .foregroundColor(.gray)

            Spacer()

            // Error Message
            if let error = errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }

            // Google Sign In Button
            Button(action: handleGoogleSignIn) {
                HStack {
                    Image(systemName: "globe")
                        .font(.system(size: 16))
                    Text("Continue with Google")
                        .fontWeight(.medium)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.white)
                .foregroundColor(.black)
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )
            }
            .disabled(isLoading)


            Spacer()
        }
        .padding()
    }

    private func handleGoogleSignIn() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await authService.signInWithOAuth()
                // OAuth will redirect and handle session automatically
            } catch {
                errorMessage = error.localizedDescription
                isLoading = false
            }
        }
    }
}

#Preview {
    AuthView()
}
