"""
Food Binary Classifier - Accuracy Testing

This script tests the food binary classifier on the test dataset
and computes accuracy metrics.
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple
import logging

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from inference import FoodClassifier

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


class AccuracyTester:
    """
    Tests the food classifier and computes accuracy metrics.
    """
    
    def __init__(self, classifier: FoodClassifier, data_dir: str = None):
        """
        Initialize the accuracy tester.
        
        Args:
            classifier: FoodClassifier instance
            data_dir: Path to data directory containing 'food' and 'not_food' subdirectories
        """
        self.classifier = classifier
        
        if data_dir is None:
            data_dir = os.path.join(os.path.dirname(__file__), 'data')
        
        self.data_dir = data_dir
        self.food_dir = os.path.join(data_dir, 'food')
        self.not_food_dir = os.path.join(data_dir, 'not_food')
        
        # Validate directories exist
        if not os.path.exists(self.food_dir):
            raise FileNotFoundError(f"Food directory not found: {self.food_dir}")
        if not os.path.exists(self.not_food_dir):
            raise FileNotFoundError(f"Not food directory not found: {self.not_food_dir}")
    
    def get_image_files(self, directory: str) -> List[str]:
        """
        Get all image files from a directory.
        
        Args:
            directory: Path to directory
            
        Returns:
            List of full paths to image files
        """
        image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.gif')
        image_files = []
        
        for file in os.listdir(directory):
            if file.lower().endswith(image_extensions) and not file.startswith('.'):
                image_files.append(os.path.join(directory, file))
        
        return sorted(image_files)
    
    def test_category(self, directory: str, expected_label: str) -> Dict:
        """
        Test all images in a category directory.
        
        Args:
            directory: Path to directory with images
            expected_label: Expected classification ('food' or 'not_food')
            
        Returns:
            Dictionary with test results
        """
        image_files = self.get_image_files(directory)
        
        if not image_files:
            logger.warning(f"No images found in {directory}")
            return {
                'total': 0,
                'correct': 0,
                'incorrect': 0,
                'accuracy': 0.0,
                'results': []
            }
        
        logger.info(f"\nTesting {len(image_files)} images from {os.path.basename(directory)}/")
        logger.info("=" * 80)
        
        correct = 0
        incorrect = 0
        results = []
        
        for image_path in image_files:
            try:
                label, confidence = self.classifier.predict(image_path)
                is_correct = (label == expected_label)
                
                if is_correct:
                    correct += 1
                    status = "✓"
                else:
                    incorrect += 1
                    status = "✗"
                
                filename = os.path.basename(image_path)
                logger.info(f"{status} {filename:50s} | Predicted: {label:10s} | Confidence: {confidence:.2%}")
                
                results.append({
                    'filename': filename,
                    'predicted': label,
                    'expected': expected_label,
                    'confidence': confidence,
                    'correct': is_correct
                })
                
            except Exception as e:
                logger.error(f"Error processing {image_path}: {e}")
                incorrect += 1
        
        total = len(image_files)
        accuracy = (correct / total * 100) if total > 0 else 0
        
        return {
            'total': total,
            'correct': correct,
            'incorrect': incorrect,
            'accuracy': accuracy,
            'results': results
        }
    
    def run_full_test(self) -> Dict:
        """
        Run tests on all data and compute overall accuracy.
        
        Returns:
            Dictionary with comprehensive test results
        """
        print("\n" + "=" * 80)
        print("FOOD BINARY CLASSIFIER - ACCURACY TEST")
        print("=" * 80)
        
        # Test food images
        food_results = self.test_category(self.food_dir, 'food')
        
        # Test not_food images
        not_food_results = self.test_category(self.not_food_dir, 'not_food')
        
        # Calculate overall metrics
        total_images = food_results['total'] + not_food_results['total']
        total_correct = food_results['correct'] + not_food_results['correct']
        total_incorrect = food_results['incorrect'] + not_food_results['incorrect']
        overall_accuracy = (total_correct / total_images * 100) if total_images > 0 else 0
        
        # Calculate precision and recall for 'food' class
        # True Positives: food images correctly classified as food
        tp = food_results['correct']
        # False Positives: not_food images incorrectly classified as food
        fp = sum(1 for r in not_food_results['results'] if r['predicted'] == 'food')
        # False Negatives: food images incorrectly classified as not_food
        fn = sum(1 for r in food_results['results'] if r['predicted'] == 'not_food')
        # True Negatives: not_food images correctly classified as not_food
        tn = not_food_results['correct']
        
        precision = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0
        recall = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0
        f1_score = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0
        
        # Print summary
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"\nFood Images:")
        print(f"  Total: {food_results['total']}")
        print(f"  Correct: {food_results['correct']}")
        print(f"  Incorrect: {food_results['incorrect']}")
        print(f"  Accuracy: {food_results['accuracy']:.2f}%")
        
        print(f"\nNot Food Images:")
        print(f"  Total: {not_food_results['total']}")
        print(f"  Correct: {not_food_results['correct']}")
        print(f"  Incorrect: {not_food_results['incorrect']}")
        print(f"  Accuracy: {not_food_results['accuracy']:.2f}%")
        
        print(f"\nOverall Performance:")
        print(f"  Total Images: {total_images}")
        print(f"  Total Correct: {total_correct}")
        print(f"  Total Incorrect: {total_incorrect}")
        print(f"  Overall Accuracy: {overall_accuracy:.2f}%")
        
        print(f"\nDetailed Metrics (for 'food' class):")
        print(f"  Precision: {precision:.2f}%")
        print(f"  Recall: {recall:.2f}%")
        print(f"  F1-Score: {f1_score:.2f}%")
        
        print(f"\nConfusion Matrix:")
        print(f"                    Predicted")
        print(f"                Food    Not Food")
        print(f"  Actual Food    {tp:4d}    {fn:4d}")
        print(f"        Not Food {fp:4d}    {tn:4d}")
        
        print("\n" + "=" * 80)
        
        return {
            'food_results': food_results,
            'not_food_results': not_food_results,
            'total_images': total_images,
            'total_correct': total_correct,
            'total_incorrect': total_incorrect,
            'overall_accuracy': overall_accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1_score,
            'confusion_matrix': {
                'tp': tp,
                'fp': fp,
                'fn': fn,
                'tn': tn
            }
        }


def main():
    """
    Main function to run accuracy tests.
    """
    try:
        # Initialize classifier
        logger.info("Initializing Food Classifier...")
        classifier = FoodClassifier()
        
        # Initialize tester
        tester = AccuracyTester(classifier)
        
        # Run tests
        results = tester.run_full_test()
        
        # Exit with appropriate code
        if results['overall_accuracy'] == 100.0:
            logger.info("\n🎉 Perfect accuracy achieved!")
            sys.exit(0)
        elif results['overall_accuracy'] >= 80.0:
            logger.info("\n✓ Good accuracy achieved!")
            sys.exit(0)
        else:
            logger.warning("\n⚠ Accuracy below 80% - model may need retraining")
            sys.exit(0)
            
    except Exception as e:
        logger.error(f"\n✗ Error during testing: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

