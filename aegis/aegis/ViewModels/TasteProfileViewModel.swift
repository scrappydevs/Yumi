//
//  TasteProfileViewModel.swift
//  aegis
//
//  ViewModel for managing food graph visualization
//

import Foundation
import SwiftUI

@MainActor
class TasteProfileViewModel: ObservableObject {
    @Published var graphData: FoodGraphData?
    @Published var nodePositions: [Int: NodePosition] = [:]
    @Published var isLoading: Bool = false
    @Published var error: String?
    @Published var minSimilarity: Double = 0.3
    @Published var selectedNode: FoodNode?
    @Published var selectedEdge: GraphEdge?
    
    private let networkService = NetworkService.shared
    private let authService = AuthService.shared
    private var animationTimer: Timer?
    
    // Physics simulation parameters
    private let repulsionStrength: CGFloat = 5000
    private let attractionStrength: CGFloat = 0.002  // Increased for stronger pull
    private let damping: CGFloat = 0.85
    private let centeringForce: CGFloat = 0.01
    
    func loadGraph(bypassCache: Bool = false) async {
        guard let authToken = authService.getAuthToken() else {
            error = "Not authenticated"
            return
        }
        
        isLoading = true
        error = nil
        
        do {
            let data = try await networkService.fetchFoodGraph(
                authToken: authToken,
                minSimilarity: minSimilarity,
                useCache: !bypassCache
            )
            self.graphData = data
            
            // Initialize node positions
            initializeNodePositions(for: data.nodes)
            
            // Start physics simulation
            startPhysicsSimulation()
            
            print("✅ Loaded graph: \(data.nodes.count) nodes, \(data.edges.count) edges \(bypassCache ? "(fresh)" : "(cached or fresh)")")
        } catch {
            self.error = "Failed to load graph: \(error.localizedDescription)"
            print("❌ Graph load error: \(error)")
        }
        
        isLoading = false
    }
    
    func refreshGraph() async {
        await loadGraph(bypassCache: true) // Always fetch fresh data when explicitly refreshing
    }
    
    private func initializeNodePositions(for nodes: [FoodNode]) {
        nodePositions.removeAll()
        
        let canvasWidth: CGFloat = 400
        let canvasHeight: CGFloat = 600
        
        // Initialize with random positions (circular arrangement)
        for (index, node) in nodes.enumerated() {
            let angle = (CGFloat(index) / CGFloat(nodes.count)) * 2 * .pi
            let radius = min(canvasWidth, canvasHeight) * 0.3
            
            let x = canvasWidth / 2 + cos(angle) * radius
            let y = canvasHeight / 2 + sin(angle) * radius
            
            nodePositions[node.id] = NodePosition(id: node.id, x: x, y: y)
        }
    }
    
    private func startPhysicsSimulation() {
        // Stop existing timer
        animationTimer?.invalidate()
        
        // Run physics simulation for 100 iterations (5 seconds at 20Hz)
        var iteration = 0
        animationTimer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { [weak self] timer in
            guard let self = self else {
                timer.invalidate()
                return
            }
            
            self.updatePhysics()
            iteration += 1
            
            if iteration >= 100 {
                timer.invalidate()
                print("✅ Physics simulation complete")
            }
        }
    }
    
    private func updatePhysics() {
        guard let graphData = graphData else { return }
        
        let canvasWidth: CGFloat = 400
        let canvasHeight: CGFloat = 600
        let centerX = canvasWidth / 2
        let centerY = canvasHeight / 2
        
        var forces: [Int: (fx: CGFloat, fy: CGFloat)] = [:]
        
        // Initialize forces
        for nodeId in nodePositions.keys {
            forces[nodeId] = (0, 0)
        }
        
        // 1. Repulsion between all nodes (they push apart)
        let nodeIds = Array(nodePositions.keys)
        for i in 0..<nodeIds.count {
            for j in (i+1)..<nodeIds.count {
                let id1 = nodeIds[i]
                let id2 = nodeIds[j]
                
                guard let pos1 = nodePositions[id1],
                      let pos2 = nodePositions[id2] else { continue }
                
                let dx = pos2.x - pos1.x
                let dy = pos2.y - pos1.y
                let distSq = max(dx * dx + dy * dy, 0.01)
                let dist = sqrt(distSq)
                
                let force = repulsionStrength / distSq
                let fx = (dx / dist) * force
                let fy = (dy / dist) * force
                
                forces[id1]!.fx -= fx
                forces[id1]!.fy -= fy
                forces[id2]!.fx += fx
                forces[id2]!.fy += fy
            }
        }
        
        // 2. Attraction along edges (connected nodes pull together based on similarity)
        // Higher similarity = stronger attraction = nodes end up closer
        for edge in graphData.edges {
            guard let pos1 = nodePositions[edge.source],
                  let pos2 = nodePositions[edge.target] else { continue }
            
            let dx = pos2.x - pos1.x
            let dy = pos2.y - pos1.y
            let dist = sqrt(dx * dx + dy * dy)
            
            if dist > 0.01 {
                // Ideal distance inversely proportional to similarity
                // High similarity (0.9) → short ideal distance (50)
                // Low similarity (0.3) → long ideal distance (150)
                let idealDistance: CGFloat = 50 + (1.0 - CGFloat(edge.weight)) * 100
                let displacement = dist - idealDistance
                
                // Spring force: pull if too far, push if too close
                let force = attractionStrength * displacement * 10 * CGFloat(edge.weight)
                let fx = (dx / dist) * force
                let fy = (dy / dist) * force
                
                forces[edge.source]!.fx += fx
                forces[edge.source]!.fy += fy
                forces[edge.target]!.fx -= fx
                forces[edge.target]!.fy -= fy
            }
        }
        
        // 3. Centering force (pull towards center)
        for (nodeId, pos) in nodePositions {
            let dx = centerX - pos.x
            let dy = centerY - pos.y
            forces[nodeId]!.fx += dx * centeringForce
            forces[nodeId]!.fy += dy * centeringForce
        }
        
        // 4. Apply forces to update positions
        for (nodeId, var pos) in nodePositions {
            guard let force = forces[nodeId] else { continue }
            
            // Update velocity
            pos.vx = (pos.vx + force.fx) * damping
            pos.vy = (pos.vy + force.fy) * damping
            
            // Update position
            pos.x += pos.vx
            pos.y += pos.vy
            
            // Keep within bounds (with padding)
            let padding: CGFloat = 40
            pos.x = max(padding, min(canvasWidth - padding, pos.x))
            pos.y = max(padding, min(canvasHeight - padding, pos.y))
            
            nodePositions[nodeId] = pos
        }
    }
    
    func selectNode(_ node: FoodNode) {
        selectedNode = node
    }
    
    func deselectNode() {
        selectedNode = nil
    }
    
    func selectEdge(_ edge: GraphEdge) {
        selectedEdge = edge
    }
    
    func deselectEdge() {
        selectedEdge = nil
    }
    
    deinit {
        animationTimer?.invalidate()
    }
}

