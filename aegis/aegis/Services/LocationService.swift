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
    static let shared = LocationService()
    
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var lastLocation: CLLocation?

    private let locationManager = CLLocationManager()

    private override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }

    func requestPermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    func getCurrentLocation() async throws -> String {
        // Check if we have a recent cached location (within last 10 minutes)
        if let location = lastLocation {
            let age = Date().timeIntervalSince(location.timestamp)
            if age < 600 { // 10 minutes - use longer cache for faster loading
                print("✅ [DEBUG] Using cached location (age: \(Int(age))s)")
                return "\(location.coordinate.latitude),\(location.coordinate.longitude)"
            } else {
                print("📍 [DEBUG] Cached location too old (\(Int(age))s), requesting fresh location")
            }
        }
        
        // If we have ANY cached location, use it immediately and update in background
        if let location = lastLocation {
            print("⚡ [DEBUG] Using stale cached location, will update in background")
            let cachedCoords = "\(location.coordinate.latitude),\(location.coordinate.longitude)"
            
            // Request fresh location in background
            Task {
                await MainActor.run {
                    locationManager.requestLocation()
                }
            }
            
            return cachedCoords
        }

        // Must access locationManager on main thread
        await MainActor.run {
            let authStatus = locationManager.authorizationStatus
            print("🔍 [DEBUG] Location auth status: \(authStatus.rawValue)")

            // Check if location services are enabled
            let servicesEnabled = CLLocationManager.locationServicesEnabled()
            print("🔍 [DEBUG] Location services enabled: \(servicesEnabled)")

            // Clear old location to ensure we get fresh data
            lastLocation = nil

            // Only request location if we have permission
            if authStatus == .authorizedWhenInUse || authStatus == .authorizedAlways {
                print("✅ [DEBUG] Location authorized, requesting fresh location")
                locationManager.requestLocation()
            } else {
                print("⚠️ [DEBUG] Location not authorized (status: \(authStatus.rawValue))")
            }
        }

        // Wait for location with multiple checks (6 attempts = 3 seconds)
        for i in 1...6 {
            try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
            if let location = lastLocation {
                print("✅ [DEBUG] Got fresh location after \(Double(i) * 0.5)s")
                return "\(location.coordinate.latitude),\(location.coordinate.longitude)"
            }
            print("⏳ [DEBUG] Waiting for location... attempt \(i)/6")
        }

        // Fallback to mock location
        print("⚠️ Using mock location (real location unavailable after 3s)")
        return "40.4406,-79.9959"  // CMU coordinates
    }
}

extension LocationService: CLLocationManagerDelegate {
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            if let location = locations.last {
                print("📍 [DEBUG] Location updated: \(location.coordinate.latitude), \(location.coordinate.longitude)")
                print("📍 [DEBUG] Accuracy: \(location.horizontalAccuracy)m, Age: \(Date().timeIntervalSince(location.timestamp))s")
                lastLocation = location
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        let nsError = error as NSError
        print("❌ [DEBUG] Location error: \(error.localizedDescription)")
        print("❌ [DEBUG] Error code: \(nsError.code), domain: \(nsError.domain)")

        // CLError codes:
        // 0 = locationUnknown (keep trying)
        // 1 = denied
        // 2 = network unavailable
        if nsError.code == 1 {
            print("❌ [DEBUG] Location permission denied by user")
        }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            let newStatus = manager.authorizationStatus
            authorizationStatus = newStatus
            print("🔐 [DEBUG] Location authorization changed to: \(newStatus.rawValue)")

            // If just authorized, request location
            if newStatus == .authorizedWhenInUse || newStatus == .authorizedAlways {
                print("✅ [DEBUG] Location authorized, starting location updates")
                manager.requestLocation()
            }
        }
    }
}

enum LocationError: Error {
    case locationNotAvailable
    case permissionDenied
}
