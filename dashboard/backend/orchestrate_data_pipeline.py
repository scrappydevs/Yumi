#!/usr/bin/env python3
"""
Orchestrator script for the complete data collection and processing pipeline.

This script coordinates three separate processes in sequence:
1. Fetch restaurant data from Google Places API (data_script.py)
2. Update image metadata with dish/cuisine info (update_image_metadata.py)
3. Generate restaurant descriptions (generate_restaurant_descriptions.py)

Usage:
    python orchestrate_data_pipeline.py --cells 5      # Process 5 grid cells
    python orchestrate_data_pipeline.py --cells all    # Process all remaining cells
    python orchestrate_data_pipeline.py --status-only  # Just check status
"""
import argparse
import subprocess
import sys
import logging
import os
from datetime import datetime
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_pipeline.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ANSI color codes for pretty output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'


class DataPipelineOrchestrator:
    """Orchestrates the complete data collection and processing pipeline."""

    def __init__(self, script_dir: str):
        """
        Initialize orchestrator.

        Args:
            script_dir: Directory containing the Python scripts
        """
        self.script_dir = script_dir
        self.data_script = os.path.join(script_dir, "data_script.py")
        self.image_update_script = os.path.join(
            script_dir, "update_image_metadata.py")
        self.description_script = os.path.join(
            script_dir, "generate_restaurant_descriptions.py")

        # Verify scripts exist
        for script in [self.data_script, self.image_update_script, self.description_script]:
            if not os.path.exists(script):
                raise FileNotFoundError(f"Required script not found: {script}")

    def print_header(self, text: str, color: str = BLUE):
        """Print a formatted header."""
        print(f"\n{color}{BOLD}{'='*70}{RESET}")
        print(f"{color}{BOLD}{text:^70}{RESET}")
        print(f"{color}{BOLD}{'='*70}{RESET}\n")

    def print_step(self, step_num: int, total_steps: int, description: str):
        """Print a step header."""
        print(
            f"\n{CYAN}{BOLD}[Step {step_num}/{total_steps}] {description}{RESET}")
        print(f"{CYAN}{'─'*70}{RESET}\n")

    def run_command(self, command: list, step_name: str) -> bool:
        """
        Run a subprocess command and stream its output in real-time.

        Args:
            command: Command and arguments as list
            step_name: Name of the step for logging

        Returns:
            True if command succeeded, False otherwise
        """
        # Add -u flag to Python commands for unbuffered output
        if len(command) > 0 and 'python' in command[0].lower():
            command.insert(1, '-u')

        logger.info(f"Running: {' '.join(command)}")

        try:
            # Use Popen to stream output in real-time
            process = subprocess.Popen(
                command,
                cwd=self.script_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,  # Line buffered
                universal_newlines=True,
                # Ensure Python unbuffered mode
                env={**os.environ, 'PYTHONUNBUFFERED': '1'}
            )

            # Stream output line by line as it's produced
            for line in process.stdout:
                print(line, end='', flush=True)

            # Wait for process to complete
            returncode = process.wait()

            if returncode == 0:
                logger.info(f"✅ {step_name} completed successfully")
                return True
            else:
                logger.error(
                    f"❌ {step_name} failed with exit code {returncode}")
                return False

        except Exception as e:
            logger.error(f"❌ Failed to run {step_name}: {e}")
            return False

    def check_status(self) -> bool:
        """
        Check the status of the data fetching process.

        Returns:
            True if status check succeeded, False otherwise
        """
        self.print_step(1, 4, "Checking Data Fetching Status")

        command = [sys.executable, self.data_script, "--status"]
        return self.run_command(command, "Status Check")

    def fetch_restaurant_data(self, num_cells: Optional[str]) -> bool:
        """
        Fetch restaurant data from Google Places API.

        Args:
            num_cells: Number of cells to process (string: number or "all")

        Returns:
            True if data fetching succeeded, False otherwise
        """
        self.print_step(2, 4, f"Fetching Restaurant Data ({num_cells} cells)")

        command = [sys.executable, self.data_script, "--cells", str(num_cells)]
        return self.run_command(command, "Data Fetching")

    def update_image_metadata(self) -> bool:
        """
        Update image metadata with dish/cuisine information.

        Returns:
            True if image update succeeded, False otherwise
        """
        self.print_step(3, 4, "Updating Image Metadata")

        command = [sys.executable, self.image_update_script]
        return self.run_command(command, "Image Metadata Update")

    def generate_descriptions(self) -> bool:
        """
        Generate restaurant descriptions using AI.

        Returns:
            True if description generation succeeded, False otherwise
        """
        self.print_step(4, 4, "Generating Restaurant Descriptions")

        command = [sys.executable, self.description_script]
        return self.run_command(command, "Description Generation")

    def run_pipeline(self, num_cells: Optional[str], status_only: bool = False):
        """
        Run the complete data pipeline.

        Args:
            num_cells: Number of cells to process (string: number or "all")
            status_only: If True, only run status check
        """
        start_time = datetime.now()

        self.print_header("🚀 DATA COLLECTION & PROCESSING PIPELINE", CYAN)

        print(f"{BOLD}Pipeline Configuration:{RESET}")
        print(f"  📍 Working Directory: {self.script_dir}")
        print(
            f"  📊 Cells to Process: {num_cells if num_cells else 'Status check only'}")
        print(f"  ⏰ Start Time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")

        # Prioritize specific coordinates before processing
        if not status_only:
            print(f"\n{CYAN}🎯 Prioritizing specific coordinates...{RESET}")
            try:
                # Import GridManager to prioritize coordinates
                import sys
                sys.path.insert(0, self.script_dir)
                from places_data_script.grid_manager import GridManager

                grid_manager = GridManager()
                priority_coords = [
                    (42.363859, -71.101230),
                    (42.363056, -71.087005),
                    (42.374229, -71.100899)
                ]

                grid_manager.prioritize_coordinates(priority_coords)
            except Exception as e:
                logger.warning(f"Failed to prioritize coordinates: {e}")
                print(
                    f"{YELLOW}⚠️  Could not prioritize coordinates, continuing anyway...{RESET}")

        # Step 1: Check status
        status_ok = self.check_status()

        if not status_ok:
            self.print_header("❌ PIPELINE FAILED - Status Check", RED)
            logger.error(
                "Status check failed. Please investigate before proceeding.")
            return False

        if status_only:
            self.print_header("✅ STATUS CHECK COMPLETE", GREEN)
            return True

        # Step 2: Fetch restaurant data
        fetch_ok = self.fetch_restaurant_data(num_cells)

        if not fetch_ok:
            self.print_header("❌ PIPELINE FAILED - Data Fetching", RED)
            logger.error(
                "Data fetching failed. Stopping pipeline before image/description processing.")
            return False

        # Step 3: Update image metadata
        logger.info("\n⏸️  Pausing 2 seconds before image processing...")
        import time
        time.sleep(2)

        image_update_ok = self.update_image_metadata()

        if not image_update_ok:
            self.print_header("❌ PIPELINE FAILED - Image Metadata", RED)
            logger.error(
                "Image metadata update failed. Stopping pipeline before description generation.")
            return False

        # Step 4: Generate descriptions
        logger.info("\n⏸️  Pausing 2 seconds before description generation...")
        time.sleep(2)

        descriptions_ok = self.generate_descriptions()

        if not descriptions_ok:
            self.print_header(
                "❌ PIPELINE FAILED - Description Generation", RED)
            logger.error("Description generation failed.")
            return False

        # Success!
        end_time = datetime.now()
        duration = end_time - start_time

        self.print_header("✅ PIPELINE COMPLETED SUCCESSFULLY", GREEN)

        print(f"\n{BOLD}Pipeline Summary:{RESET}")
        print(f"  ✅ Data fetched for {num_cells} cells")
        print(f"  ✅ Image metadata updated")
        print(f"  ✅ Restaurant descriptions generated")
        print(f"  ⏱️  Total Duration: {duration}")
        print(f"  🏁 Completed: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print()

        logger.info(f"Pipeline completed successfully in {duration}")
        return True


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Orchestrate the complete data collection and processing pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python orchestrate_data_pipeline.py --cells 5       # Process 5 grid cells
  python orchestrate_data_pipeline.py --cells all     # Process all remaining cells
  python orchestrate_data_pipeline.py --status-only   # Just check status
        """
    )
    parser.add_argument(
        '--cells',
        type=str,
        help='Number of cells to process (or "all" for all pending)'
    )
    parser.add_argument(
        '--status-only',
        action='store_true',
        help='Only run status check, do not process data'
    )

    args = parser.parse_args()

    # Validate arguments
    if not args.status_only and not args.cells:
        parser.error(
            "Either --cells or --status-only must be specified")

    if args.cells and args.cells.lower() != 'all':
        try:
            num = int(args.cells)
            if num <= 0:
                parser.error("Number of cells must be positive")
        except ValueError:
            parser.error('--cells must be a number or "all"')

    # Get script directory (current file's directory)
    script_dir = os.path.dirname(os.path.abspath(__file__))

    try:
        orchestrator = DataPipelineOrchestrator(script_dir)
        success = orchestrator.run_pipeline(args.cells, args.status_only)

        sys.exit(0 if success else 1)

    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Pipeline interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"\n\n❌ Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
