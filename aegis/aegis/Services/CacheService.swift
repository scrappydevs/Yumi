//
//  CacheService.swift
//  aegis
//
//  Local caching service for API responses
//  Reduces API calls and improves app responsiveness
//

import Foundation

class CacheService {
    static let shared = CacheService()
    
    private init() {}
    
    // MARK: - Cache Configuration
    
    private enum CacheKey: String {
        case reviews = "cached_reviews"
        case tasteProfile = "cached_taste_profile"
        case tasteProfileText = "cached_taste_profile_text"
        case discoverRestaurants = "cached_discover_restaurants"
        case lastCacheUpdate = "last_cache_update"
    }
    
    // Cache expiry durations (in seconds)
    private let reviewsCacheExpiry: TimeInterval = 300 // 5 minutes
    private let tasteProfileCacheExpiry: TimeInterval = 600 // 10 minutes
    private let tasteProfileTextCacheExpiry: TimeInterval = 600 // 10 minutes
    private let discoverCacheExpiry: TimeInterval = 1800 // 30 minutes
    
    // MARK: - File Manager Helper
    
    private func cacheDirectory() -> URL? {
        return FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first
    }
    
    private func cacheFileURL(for key: CacheKey) -> URL? {
        guard let cacheDir = cacheDirectory() else { return nil }
        return cacheDir.appendingPathComponent("\(key.rawValue).json")
    }
    
    // MARK: - Generic Cache Methods
    
    private func saveToCache<T: Encodable>(_ data: T, key: CacheKey) {
        guard let fileURL = cacheFileURL(for: key) else {
            print("❌ [CACHE] Failed to get cache file URL for \(key.rawValue)")
            return
        }
        
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let jsonData = try encoder.encode(data)
            try jsonData.write(to: fileURL)
            
            // Update timestamp
            updateCacheTimestamp(for: key)
            
            print("✅ [CACHE] Saved \(key.rawValue) to cache")
        } catch {
            print("❌ [CACHE] Failed to save \(key.rawValue): \(error)")
        }
    }
    
    private func loadFromCache<T: Decodable>(_ type: T.Type, key: CacheKey, expiryDuration: TimeInterval) -> T? {
        guard let fileURL = cacheFileURL(for: key) else {
            print("❌ [CACHE] Failed to get cache file URL for \(key.rawValue)")
            return nil
        }
        
        // Check if cache exists
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            print("ℹ️ [CACHE] No cache found for \(key.rawValue)")
            return nil
        }
        
        // Check if cache is expired
        if isCacheExpired(for: key, expiryDuration: expiryDuration) {
            print("⏰ [CACHE] Cache expired for \(key.rawValue)")
            clearCache(for: key)
            return nil
        }
        
        do {
            let data = try Data(contentsOf: fileURL)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let decoded = try decoder.decode(type, from: data)
            print("✅ [CACHE] Loaded \(key.rawValue) from cache")
            return decoded
        } catch {
            print("❌ [CACHE] Failed to load \(key.rawValue): \(error)")
            clearCache(for: key)
            return nil
        }
    }
    
    private func clearCache(for key: CacheKey) {
        guard let fileURL = cacheFileURL(for: key) else { return }
        
        do {
            if FileManager.default.fileExists(atPath: fileURL.path) {
                try FileManager.default.removeItem(at: fileURL)
                print("✅ [CACHE] Cleared cache for \(key.rawValue)")
            }
            clearCacheTimestamp(for: key)
        } catch {
            print("❌ [CACHE] Failed to clear \(key.rawValue): \(error)")
        }
    }
    
    // MARK: - Cache Timestamp Management
    
    private func timestampKey(for cacheKey: CacheKey) -> String {
        return "\(CacheKey.lastCacheUpdate.rawValue)_\(cacheKey.rawValue)"
    }
    
    private func updateCacheTimestamp(for key: CacheKey) {
        UserDefaults.standard.set(Date(), forKey: timestampKey(for: key))
    }
    
    private func getCacheTimestamp(for key: CacheKey) -> Date? {
        return UserDefaults.standard.object(forKey: timestampKey(for: key)) as? Date
    }
    
    private func clearCacheTimestamp(for key: CacheKey) {
        UserDefaults.standard.removeObject(forKey: timestampKey(for: key))
    }
    
    private func isCacheExpired(for key: CacheKey, expiryDuration: TimeInterval) -> Bool {
        guard let timestamp = getCacheTimestamp(for: key) else {
            return true // No timestamp means expired
        }
        
        let age = Date().timeIntervalSince(timestamp)
        return age > expiryDuration
    }
    
    // MARK: - Public API - Reviews
    
    func cacheReviews(_ reviews: [Review]) {
        saveToCache(reviews, key: .reviews)
    }
    
    func loadCachedReviews() -> [Review]? {
        return loadFromCache([Review].self, key: .reviews, expiryDuration: reviewsCacheExpiry)
    }
    
    func clearReviewsCache() {
        clearCache(for: .reviews)
    }
    
    // MARK: - Public API - Taste Profile
    
    func cacheTasteProfile(_ profile: FoodGraphData) {
        saveToCache(profile, key: .tasteProfile)
    }
    
    func loadCachedTasteProfile() -> FoodGraphData? {
        return loadFromCache(FoodGraphData.self, key: .tasteProfile, expiryDuration: tasteProfileCacheExpiry)
    }
    
    func clearTasteProfileCache() {
        clearCache(for: .tasteProfile)
    }
    
    // MARK: - Taste Profile Text Caching
    func cacheTasteProfileText(_ profileText: TasteProfileTextResponse) {
        saveToCache(profileText, key: .tasteProfileText)
    }
    
    func loadCachedTasteProfileText() -> TasteProfileTextResponse? {
        return loadFromCache(TasteProfileTextResponse.self, key: .tasteProfileText, expiryDuration: tasteProfileTextCacheExpiry)
    }
    
    func clearTasteProfileTextCache() {
        clearCache(for: .tasteProfileText)
    }
    
    // MARK: - Public API - Discover Restaurants
    
    func cacheDiscoverRestaurants(_ response: DiscoverResponse) {
        saveToCache(response, key: .discoverRestaurants)
    }
    
    func loadCachedDiscoverRestaurants() -> DiscoverResponse? {
        return loadFromCache(DiscoverResponse.self, key: .discoverRestaurants, expiryDuration: discoverCacheExpiry)
    }
    
    func clearDiscoverCache() {
        clearCache(for: .discoverRestaurants)
    }
    
    // MARK: - Cache Utilities
    
    func clearAllCaches() {
        clearReviewsCache()
        clearTasteProfileCache()
        clearDiscoverCache()
        print("✅ [CACHE] Cleared all caches")
    }
    
    private func getCacheAge(for key: CacheKey) -> TimeInterval? {
        guard let timestamp = getCacheTimestamp(for: key) else {
            return nil
        }
        return Date().timeIntervalSince(timestamp)
    }
    
    private func getCacheStatus() -> [String: String] {
        var status: [String: String] = [:]
        
        for key in [CacheKey.reviews, CacheKey.tasteProfile, CacheKey.discoverRestaurants] {
            if let age = getCacheAge(for: key) {
                let minutes = Int(age / 60)
                let seconds = Int(age.truncatingRemainder(dividingBy: 60))
                status[key.rawValue] = "\(minutes)m \(seconds)s old"
            } else {
                status[key.rawValue] = "Not cached"
            }
        }
        
        return status
    }
}
