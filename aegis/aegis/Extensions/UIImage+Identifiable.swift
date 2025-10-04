//
//  UIImage+Identifiable.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import UIKit

extension UIImage: Identifiable {
    public var id: String {
        // Use image hash as identifier
        return "\(hash)"
    }
}
