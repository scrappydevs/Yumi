#!/usr/bin/env python3
"""
Main orchestrator script for fetching restaurant data from Google Places API.

Usage:
    python data_script.py --init                    # Initialize grid
    python data_script.py --cells 5                 # Process 5 grid cells
    python data_script.py --cells all               # Process all remaining cells
    python data_script.py --status                  # Check progress
"""
import argparse
import logging
import sys
import os
from typing import List
from datetime import datetime

from grid_manager import GridManager
from places_api import PlacesAPI
from database import DatabaseManager
from models import GridCell
from config import PHOTO_MAX_WIDTH

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('places_fetch.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class RestaurantDataFetcher:
    """Main orchestrator for restaurant data fetching."""

    def __init__(self):
        self.grid_manager = GridManager()
        self.places_api = PlacesAPI()
        self.db_manager = DatabaseManager()
        self.processed_place_ids = set()

    def initialize(self):
        """Initialize the grid and prepare for processing."""
        logger.info("🔧 Initializing grid...")
        self.grid_manager.initialize_grid_file()
        logger.info("✅ Initialization complete")

    def show_status(self):
        """Display current processing status."""
        stats = self.grid_manager.get_statistics()

        print("\n" + "="*60)
        print("📊 RESTAURANT DATA FETCHING STATUS")
        print("="*60)
        print(f"Total Grid Cells:     {stats['total']}")
        print(f"  ✅ Completed:       {stats['completed']}")
        print(f"  ⏳ Pending:         {stats['pending']}")
        print(f"  ⚠️  Failed:          {stats['failed']}")
        print(f"  🔄 Processing:      {stats['processing']}")
        print(f"\n🍽️  Total Places Found: {stats['total_places']}")

        # Get database count
        db_count = self.db_manager.get_restaurant_count()
        print(f"💾 Restaurants in DB:  {db_count}")

        print("="*60 + "\n")

    def process_grid_cell(self, cell: GridCell) -> int:
        """
        Process a single grid cell.

        Args:
            cell: GridCell to process

        Returns:
            Number of places found
        """
        logger.info(f"🔍 Processing grid cell: {cell.lat:.6f}, {cell.lng:.6f}")

        try:
            # Mark as processing
            self.grid_manager.update_cell_status(cell, "processing")

            # Get all nearby restaurants with pagination
            places = self.places_api.get_all_nearby_restaurants(
                cell.lat, cell.lng)

            if not places:
                logger.info("No places found in this cell")
                self.grid_manager.update_cell_status(
                    cell, "completed", places_found=0)
                return 0

            # Refresh processed place IDs from database
            self.processed_place_ids = self.db_manager.get_processed_place_ids()

            new_places_count = 0

            for i, place in enumerate(places, 1):
                place_id = place.get("place_id")
                name = place.get("name", "Unknown")

                logger.info(f"  [{i}/{len(places)}] Processing: {name}")

                # Skip if already processed
                if place_id in self.processed_place_ids:
                    logger.info(f"    ⏭️  Already in database, skipping")
                    continue

                # Get detailed information
                restaurant = self.places_api.get_place_details(place_id)
                if not restaurant:
                    logger.warning(f"    ⚠️  Failed to get details")
                    continue

                # Save restaurant
                restaurant_id = self.db_manager.save_restaurant(restaurant)
                if not restaurant_id:
                    logger.error(f"    ❌ Failed to save restaurant")
                    continue

                self.processed_place_ids.add(place_id)
                new_places_count += 1

                # Get and save photos
                photos = self.places_api.get_place_photos(place_id)
                logger.info(f"    📸 Found {len(photos)} photos")

                for j, photo in enumerate(photos, 1):
                    # Download photo
                    photo_bytes = self.places_api.download_photo(
                        photo.photo_reference,
                        max_width=PHOTO_MAX_WIDTH
                    )

                    if photo_bytes:
                        # Upload to Supabase storage
                        filename = f"restaurants/{place_id}_{j}.jpg"
                        photo_url = self.db_manager.upload_photo_to_storage(
                            photo_bytes,
                            filename
                        )

                        if photo_url:
                            # Save photo metadata to images table
                            self.db_manager.save_restaurant_image(
                                restaurant_id,
                                photo,
                                photo_url,
                                restaurant.name
                            )
                            logger.info(
                                f"      ✅ Saved photo {j}/{len(photos)}")
                        else:
                            logger.warning(
                                f"      ⚠️  Failed to upload photo {j}")
                    else:
                        logger.warning(
                            f"      ⚠️  Failed to download photo {j}")

                # Get and save reviews
                reviews = self.places_api.get_place_reviews(place_id)
                if reviews:
                    self.db_manager.save_restaurant_reviews(
                        restaurant_id, restaurant.name, reviews)
                    logger.info(f"    💬 Saved {len(reviews)} reviews")

            # Mark cell as completed
            self.grid_manager.update_cell_status(
                cell,
                "completed",
                places_found=len(places)
            )

            logger.info(
                f"✅ Completed cell: {new_places_count} new places added")
            return new_places_count

        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Failed to process cell: {error_msg}")
            self.grid_manager.update_cell_status(
                cell, "failed", error_message=error_msg)
            return 0

    def process_cells(self, num_cells: int = None):
        """
        Process multiple grid cells.

        Args:
            num_cells: Number of cells to process (None = all pending)
        """
        pending_cells = self.grid_manager.get_pending_cells(limit=num_cells)

        if not pending_cells:
            logger.info("🎉 No pending cells to process!")
            return

        total = len(pending_cells)
        logger.info(f"📋 Processing {total} grid cell(s)")
        logger.info("="*60)

        total_new_places = 0
        start_time = datetime.now()

        for i, cell in enumerate(pending_cells, 1):
            logger.info(f"\n🔄 Cell {i}/{total}")
            places_count = self.process_grid_cell(cell)
            total_new_places += places_count

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        logger.info("\n" + "="*60)
        logger.info(f"✅ BATCH COMPLETE")
        logger.info(f"   Cells Processed: {total}")
        logger.info(f"   New Places: {total_new_places}")
        logger.info(f"   Duration: {duration:.1f} seconds")
        logger.info("="*60 + "\n")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Fetch restaurant data from Google Places API"
    )
    parser.add_argument(
        '--init',
        action='store_true',
        help='Initialize grid (creates grid_progress.txt)'
    )
    parser.add_argument(
        '--cells',
        type=str,
        help='Number of cells to process (or "all" for all pending)'
    )
    parser.add_argument(
        '--status',
        action='store_true',
        help='Show processing status'
    )

    args = parser.parse_args()

    # Create fetcher instance
    fetcher = RestaurantDataFetcher()

    try:
        if args.init:
            fetcher.initialize()
        elif args.status:
            fetcher.show_status()
        elif args.cells:
            if args.cells.lower() == 'all':
                fetcher.process_cells(num_cells=None)
            else:
                try:
                    num = int(args.cells)
                    if num <= 0:
                        print("❌ Error: Number of cells must be positive")
                        sys.exit(1)
                    fetcher.process_cells(num_cells=num)
                except ValueError:
                    print('❌ Error: --cells must be a number or "all"')
                    sys.exit(1)
        else:
            parser.print_help()

    except KeyboardInterrupt:
        logger.info("\n⚠️  Interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
