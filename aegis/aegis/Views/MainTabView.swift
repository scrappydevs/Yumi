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
            
            // Tab 2: Camera (Center)
            CameraTabView(selectedTab: $selectedTab)
                .tabItem {
                    Label("Camera", systemImage: "camera.fill")
                }
                .tag(1)
            
            // Tab 3: Friends
            FriendsView()
                .tabItem {
                    Label("Friends", systemImage: "person.2.fill")
                }
                .tag(2)
            
            // Tab 4: Taste Profile
            NavigationView {
                TasteProfileView()
            }
            .tabItem {
                Label("Taste Profile", systemImage: "chart.pie")
            }
            .tag(3)
        }
        .accentColor(.blue)
    }
}

// MARK: - Camera Tab View
struct CameraTabView: View {
    @Binding var selectedTab: Int
    @State private var showCamera = false
    @State private var capturedImage: UIImage?
    @State private var uploadedImageId: Int?
    @State private var showAIAnalyzing = false
    @State private var showReviewForm = false
    
    var body: some View {
        Color.clear
            .onAppear {
                // Automatically open camera when tab is tapped
                showCamera = true
            }
            .fullScreenCover(isPresented: $showCamera, onDismiss: {
                // After camera dismisses, show AI analyzing screen if we have an image
                if capturedImage != nil {
                    // Small delay for smooth transition
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        showAIAnalyzing = true
                    }
                } else {
                    // If no image captured, go back to Reviews tab
                    selectedTab = 0
                }
            }) {
                CustomCameraView { image in
                    capturedImage = image
                }
            }
            .fullScreenCover(isPresented: $showAIAnalyzing) {
                AIAnalyzingLoadingView(
                    capturedImage: $capturedImage,
                    uploadedImageId: $uploadedImageId,
                    onComplete: {
                        showAIAnalyzing = false
                        // Small delay for smooth transition
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                            showReviewForm = true
                        }
                    }
                )
            }
            .sheet(isPresented: $showReviewForm, onDismiss: {
                // After review submission, navigate to Reviews tab
                capturedImage = nil
                uploadedImageId = nil
                showCamera = false
                
                // Switch to Reviews tab to see the new review
                selectedTab = 0
            }) {
                SheetContentView(capturedImage: $capturedImage, imageId: $uploadedImageId)
            }
    }
}

#Preview {
    MainTabView()
}

