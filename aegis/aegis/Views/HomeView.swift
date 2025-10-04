//
//  HomeView.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import SwiftUI

struct HomeView: View {
    @ObservedObject private var authService = AuthService.shared
    @State private var issues: [Issue] = []
    @State private var isLoading = false
    @State private var showCamera = false
    @State private var imageToReport: UIImage?  // Changed name and this will drive the form sheet

    var body: some View {
        NavigationView {
            ZStack {
                // Issues List
                if isLoading {
                    ProgressView("Loading issues...")
                } else if issues.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        Text("No issues reported yet")
                            .font(.headline)
                            .foregroundColor(.gray)
                        Text("Tap the + button to report an issue")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                } else {
                    List(issues) { issue in
                        IssueRowView(issue: issue)
                    }
                    .refreshable {
                        await loadIssues()
                    }
                }

                // Floating Action Button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: {
                            showCamera = true
                        }) {
                            Image(systemName: "plus")
                                .font(.title)
                                .foregroundColor(.white)
                                .frame(width: 60, height: 60)
                                .background(Color.blue)
                                .clipShape(Circle())
                                .shadow(radius: 5)
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("My Issues")
            .navigationBarItems(trailing: Button("Sign Out") {
                Task {
                    try? await authService.signOut()
                }
            })
            .task {
                await loadIssues()
            }
        }
        .sheet(isPresented: $showCamera) {
            CameraView { image in
                print("📸 [DEBUG] Camera captured image")
                imageToReport = image
                print("📸 [DEBUG] Set imageToReport")
            }
        }
        .sheet(item: $imageToReport) { image in
            IssueFormView(capturedImage: image)
                .onAppear {
                    print("📝 [DEBUG] IssueFormView appearing with image")
                }
                .onDisappear {
                    print("📝 [DEBUG] IssueFormView disappearing")
                    imageToReport = nil
                    Task {
                        await loadIssues()
                    }
                }
        }
    }

    private func loadIssues() async {
        guard let authToken = authService.getAuthToken() else { return }

        isLoading = true
        do {
            issues = try await NetworkService.shared.fetchUserIssues(authToken: authToken)
        } catch {
            print("Failed to load issues: \(error)")
        }
        isLoading = false
    }
}

struct IssueRowView: View {
    let issue: Issue

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(issue.description ?? "No description")
                    .font(.body)
                    .lineLimit(2)
                Spacer()
                if let status = issue.status {
                    StatusBadge(status: status)
                }
            }

            HStack {
                Image(systemName: "location")
                    .font(.caption)
                Text(issue.geolocation ?? "Unknown location")
                    .font(.caption)
                    .foregroundColor(.gray)

                Spacer()

                Text(issue.timestamp, style: .date)
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .padding(.vertical, 4)
    }
}

struct StatusBadge: View {
    let status: IssueStatus

    var body: some View {
        Text(statusText)
            .font(.caption)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor)
            .foregroundColor(.white)
            .cornerRadius(8)
    }

    private var statusText: String {
        status.displayName
    }

    private var statusColor: Color {
        switch status {
        case .incomplete:
            return .orange
        case .complete:
            return .green
        }
    }
}

#Preview {
    HomeView()
}
