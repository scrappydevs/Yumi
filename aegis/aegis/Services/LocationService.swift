//
//  LocationService.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import Foundation
import CoreLocation

@MainActor
class LocationService: NSObject, ObservableObject {
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var lastLocation: CLLocation?

    private let locationManager = CLLocationManager()

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }

    func requestPermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    func getCurrentLocation() async throws -> String {
        // Check authorization status without blocking main thread
        let authStatus = await MainActor.run { locationManager.authorizationStatus.rawValue }
        print("🔍 [DEBUG] Location auth status: \(authStatus)")

        // Check if location services are enabled (can be called from any thread)
        let servicesEnabled = CLLocationManager.locationServicesEnabled()
        print("🔍 [DEBUG] Location services enabled: \(servicesEnabled)")

        // Request location update
        locationManager.requestLocation()

        // Wait for location with multiple checks
        for i in 1...5 {
            try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
            if let location = lastLocation {
                print("✅ [DEBUG] Got real location after \(Double(i) * 0.5)s")
                return "\(location.coordinate.latitude),\(location.coordinate.longitude)"
            }
            print("⏳ [DEBUG] Waiting for location... attempt \(i)/5")
        }

        // Fallback to mock location
        print("⚠️ Using mock location (real location unavailable)")
        print("🔍 [DEBUG] Last location was: \(String(describing: lastLocation))")
        return "40.4406,-79.9959"  // CMU coordinates
    }
}

extension LocationService: CLLocationManagerDelegate {
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            lastLocation = locations.last
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error.localizedDescription)")
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            authorizationStatus = manager.authorizationStatus
        }
    }
}

enum LocationError: Error {
    case locationNotAvailable
    case permissionDenied
}
