//
//  StarRatingView.swift
//  aegis
//
//  Food review star rating component with beautiful glassmorphism design
//

import SwiftUI

struct StarRatingView: View {
    @Binding var rating: Int
    var maximumRating = 5
    var onColor: Color = .yellow
    var offColor: Color = .gray.opacity(0.3)
    
    var body: some View {
        HStack(spacing: 12) {
            ForEach(1...maximumRating, id: \.self) { number in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                        rating = number
                        // Haptic feedback
                        let impactMed = UIImpactFeedbackGenerator(style: .medium)
                        impactMed.impactOccurred()
                    }
                } label: {
                    Image(systemName: number <= rating ? "star.fill" : "star")
                        .font(.system(size: 32))
                        .foregroundColor(number <= rating ? onColor : offColor)
                        .shadow(color: number <= rating ? onColor.opacity(0.3) : .clear, radius: 8, x: 0, y: 4)
                }
                .scaleEffect(number == rating ? 1.15 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: rating)
            }
        }
        .padding(.vertical, 8)
    }
}

#Preview {
    @Previewable @State var rating = 3
    
    VStack(spacing: 30) {
        StarRatingView(rating: $rating)
        
        Text("\(rating) stars")
            .font(.headline)
    }
    .padding()
}

