//
//  LoadingView.swift
//  aegis
//
//  AI-powered loading screen with Yummy branding
//

import SwiftUI

struct LoadingView: View {
    @State private var messageIndex = 0
    @State private var logoScale: CGFloat = 0.8
    @State private var rotationAngle: Double = 0
    @State private var orbPosition: CGFloat = 0
    
    let messages = [
        "Preparing your taste...",
        "Analyzing preferences...",
        "Discovering restaurants...",
        "Personalizing recommendations...",
        "Almost ready..."
    ]
    
    var body: some View {
        ZStack {
            // Clean white background
            Color.white
                .ignoresSafeArea()
            
            // AI-style animated orbs in background
            ZStack {
                // Purple orb
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.purple.opacity(0.15),
                                Color.purple.opacity(0.05),
                                Color.clear
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: 150
                        )
                    )
                    .frame(width: 300, height: 300)
                    .offset(x: -100 + orbPosition, y: -200)
                    .blur(radius: 40)
                
                // Blue orb
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.blue.opacity(0.15),
                                Color.blue.opacity(0.05),
                                Color.clear
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: 150
                        )
                    )
                    .frame(width: 300, height: 300)
                    .offset(x: 100 - orbPosition, y: 200)
                    .blur(radius: 40)
                
                // Pink orb
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.pink.opacity(0.12),
                                Color.pink.opacity(0.04),
                                Color.clear
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: 120
                        )
                    )
                    .frame(width: 240, height: 240)
                    .offset(x: orbPosition * 0.7, y: 0)
                    .blur(radius: 35)
            }
            
            VStack(spacing: 40) {
                Spacer()
                
                // Yummy Logo with gradient ring
                ZStack {
                    // Rotating gradient ring (AI-style)
                    Circle()
                        .trim(from: 0, to: 0.7)
                        .stroke(
                            LinearGradient(
                                colors: [.blue, .purple, .pink, .blue],
                                startPoint: .leading,
                                endPoint: .trailing
                            ),
                            style: StrokeStyle(lineWidth: 3, lineCap: .round)
                        )
                        .frame(width: 140, height: 140)
                        .rotationEffect(.degrees(rotationAngle))
                    
                    // Yummy Logo
                    Image("yummylogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 100, height: 100)
                        .scaleEffect(logoScale)
                }
                
                // AI Message with gradient
                Text(messages[messageIndex])
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [
                                Color(red: 0.3, green: 0.4, blue: 0.9),
                                Color(red: 0.6, green: 0.3, blue: 0.9)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .transition(.opacity)
                    .id("message-\(messageIndex)")
                
                // Progress dots (AI-style)
                HStack(spacing: 8) {
                    ForEach(0..<3) { index in
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.blue, .purple],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 8, height: 8)
                            .opacity(0.6)
                            .scaleEffect(messageIndex % 3 == index ? 1.3 : 1.0)
                            .animation(.easeInOut(duration: 0.3).repeatForever(), value: messageIndex)
                    }
                }
                
                Spacer()
                
                // Powered by AI text
                Text("powered by AI")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.gray.opacity(0.5))
                    .padding(.bottom, 40)
            }
        }
        .onAppear {
            startAnimations()
        }
    }
    
    private func startAnimations() {
        // Logo gentle pulse
        withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
            logoScale = 1.05
        }
        
        // Rotating gradient ring
        withAnimation(.linear(duration: 3.0).repeatForever(autoreverses: false)) {
            rotationAngle = 360
        }
        
        // Floating orbs
        withAnimation(.easeInOut(duration: 4.0).repeatForever(autoreverses: true)) {
            orbPosition = 30
        }
        
        // Message rotation
        Timer.scheduledTimer(withTimeInterval: 2.5, repeats: true) { _ in
            withAnimation(.easeInOut(duration: 0.5)) {
                messageIndex = (messageIndex + 1) % messages.count
            }
        }
    }
}

#Preview {
    LoadingView()
}
