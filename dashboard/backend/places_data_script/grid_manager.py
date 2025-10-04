"""
Grid generation and management for spatial coverage.
"""
import math
from typing import List, Tuple
from models import GridCell
from config import (
    TOP_LEFT, BOTTOM_RIGHT, SEARCH_RADIUS_METERS,
    OVERLAP_FACTOR, PRIORITY_LOCATION, GRID_PROGRESS_FILE
)
import os


class GridManager:
    """Manages grid cell generation and tracking."""

    def __init__(self):
        self.grid_file = GRID_PROGRESS_FILE

    def generate_grid(self) -> List[GridCell]:
        """
        Generate a grid of overlapping circles to cover the bounding box.
        Returns list of GridCell objects with center coordinates.
        """
        lat_min = BOTTOM_RIGHT[0]
        lat_max = TOP_LEFT[0]
        lng_min = TOP_LEFT[1]
        lng_max = BOTTOM_RIGHT[1]

        # Calculate center
        center_lat = (lat_min + lat_max) / 2
        center_lng = (lng_min + lng_max) / 2

        # Calculate step size with overlap
        # At this latitude, approximate conversion: 1 degree lat ≈ 111 km
        # For longitude at ~42°N: 1 degree lng ≈ 83 km

        radius_km = SEARCH_RADIUS_METERS / 1000
        step_distance_km = radius_km * (1 - OVERLAP_FACTOR)

        # Convert to degrees
        lat_step = step_distance_km / 111.0
        lng_step = step_distance_km / \
            (111.0 * math.cos(math.radians(center_lat)))

        # Generate grid points
        cells = []
        lat = lat_min
        while lat <= lat_max:
            lng = lng_min
            while lng <= lng_max:
                cells.append(GridCell(lat=lat, lng=lng))
                lng += lng_step
            lat += lat_step

        # Sort cells to prioritize the one closest to PRIORITY_LOCATION
        cells = self._prioritize_cells(cells)

        return cells

    def _prioritize_cells(self, cells: List[GridCell]) -> List[GridCell]:
        """
        Sort cells so the one closest to PRIORITY_LOCATION is first.
        """
        priority_lat, priority_lng = PRIORITY_LOCATION

        def distance(cell: GridCell) -> float:
            """Calculate approximate distance in degrees."""
            return math.sqrt(
                (cell.lat - priority_lat)**2 +
                (cell.lng - priority_lng)**2
            )

        return sorted(cells, key=distance)

    def initialize_grid_file(self):
        """Generate grid and save to file if it doesn't exist."""
        if os.path.exists(self.grid_file):
            print(f"⚠️  Grid file already exists: {self.grid_file}")
            response = input(
                "Regenerate grid? This will reset all progress! (yes/no): ")
            if response.lower() != 'yes':
                print("Keeping existing grid file.")
                return

        cells = self.generate_grid()
        self.save_grid(cells)
        print(f"✅ Generated {len(cells)} grid cells")
        print(f"📍 Priority cell (closest to {PRIORITY_LOCATION}): "
              f"{cells[0].lat:.6f}, {cells[0].lng:.6f}")

    def load_grid(self) -> List[GridCell]:
        """Load grid cells from file."""
        if not os.path.exists(self.grid_file):
            raise FileNotFoundError(
                f"Grid file not found: {self.grid_file}. Run with --init first.")

        cells = []
        with open(self.grid_file, 'r') as f:
            for line in f:
                if line.strip():
                    cells.append(GridCell.from_string(line))
        return cells

    def save_grid(self, cells: List[GridCell]):
        """Save grid cells to file."""
        with open(self.grid_file, 'w') as f:
            for cell in cells:
                f.write(cell.to_string() + '\n')

    def update_cell_status(self, cell: GridCell, status: str,
                           places_found: int = 0, error_message: str = None):
        """Update a cell's status in the grid file."""
        cells = self.load_grid()

        # Find and update the matching cell
        for i, c in enumerate(cells):
            if abs(c.lat - cell.lat) < 0.0001 and abs(c.lng - cell.lng) < 0.0001:
                cells[i].status = status
                cells[i].places_found = places_found
                cells[i].error_message = error_message
                break

        self.save_grid(cells)

    def get_pending_cells(self, limit: int = None) -> List[GridCell]:
        """Get pending cells to process."""
        cells = self.load_grid()
        pending = [c for c in cells if c.status == "pending"]

        if limit:
            return pending[:limit]
        return pending

    def get_statistics(self) -> dict:
        """Get processing statistics."""
        cells = self.load_grid()

        stats = {
            'total': len(cells),
            'pending': len([c for c in cells if c.status == 'pending']),
            'completed': len([c for c in cells if c.status == 'completed']),
            'failed': len([c for c in cells if c.status == 'failed']),
            'processing': len([c for c in cells if c.status == 'processing']),
            'total_places': sum(c.places_found for c in cells if c.status == 'completed')
        }

        return stats
