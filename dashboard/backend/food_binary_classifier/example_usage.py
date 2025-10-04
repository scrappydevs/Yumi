"""
Example usage of the Food Binary Classifier

This script demonstrates how to use the FoodClassifier in your code.
"""

from inference import FoodClassifier
import os


def example_single_image():
    """Example: Classify a single image"""
    print("\n" + "="*60)
    print("Example 1: Classifying a Single Image")
    print("="*60)

    classifier = FoodClassifier()

    # Path to an image
    image_path = os.path.join(
        os.path.dirname(__file__),
        'data/food/ChIJ_3Ksr2x344kRvwN5KyrNiMc_2.jpg'
    )

    # Get prediction
    label, confidence = classifier.predict(image_path)

    print(f"\nImage: {os.path.basename(image_path)}")
    print(f"Prediction: {label}")
    print(f"Confidence: {confidence:.2%}")


def example_batch_prediction():
    """Example: Classify multiple images at once"""
    print("\n" + "="*60)
    print("Example 2: Batch Classification")
    print("="*60)

    classifier = FoodClassifier()

    # Get all food images
    food_dir = os.path.join(os.path.dirname(__file__), 'data/food')
    image_paths = [
        os.path.join(food_dir, f)
        for f in os.listdir(food_dir)
        if f.endswith(('.jpg', '.jpeg', '.png'))
    ][:3]  # Just first 3

    # Batch prediction
    results = classifier.predict_batch(image_paths)

    print("\nResults:")
    for image_path, label, confidence in results:
        print(
            f"  {os.path.basename(image_path):30s} -> {label:10s} ({confidence:.2%})")


def example_with_threshold():
    """Example: Using a custom confidence threshold"""
    print("\n" + "="*60)
    print("Example 3: Using Custom Confidence Threshold")
    print("="*60)

    classifier = FoodClassifier()

    # Set a higher threshold for "food" classification
    CONFIDENCE_THRESHOLD = 0.75  # 75% confidence

    image_path = os.path.join(
        os.path.dirname(__file__),
        'data/food/ChIJ_3Ksr2x344kRvwN5KyrNiMc_10.jpg'
    )

    label, confidence = classifier.predict(image_path)

    # Apply custom threshold
    if label == 'food' and confidence < CONFIDENCE_THRESHOLD:
        result = 'uncertain'
    else:
        result = label

    print(f"\nImage: {os.path.basename(image_path)}")
    print(f"Raw Prediction: {label} ({confidence:.2%})")
    print(f"With {CONFIDENCE_THRESHOLD:.0%} threshold: {result}")


def example_error_handling():
    """Example: Handling errors gracefully"""
    print("\n" + "="*60)
    print("Example 4: Error Handling")
    print("="*60)

    classifier = FoodClassifier()

    # Try to classify a non-existent file
    fake_path = '/path/to/nonexistent/image.jpg'

    try:
        label, confidence = classifier.predict(fake_path)
        print(f"Prediction: {label} ({confidence:.2%})")
    except FileNotFoundError:
        print(f"\n❌ Error: Image not found at {fake_path}")
    except Exception as e:
        print(f"\n❌ Error: {e}")


def example_integration_function(image_path: str) -> dict:
    """
    Example integration function that returns structured results.

    This is useful when integrating the classifier into a larger system.
    """
    try:
        classifier = FoodClassifier()
        label, confidence = classifier.predict(image_path)

        return {
            'success': True,
            'is_food': label == 'food',
            'label': label,
            'confidence': confidence,
            'error': None
        }
    except Exception as e:
        return {
            'success': False,
            'is_food': False,
            'label': None,
            'confidence': 0.0,
            'error': str(e)
        }


def example_integration():
    """Example: Integration function usage"""
    print("\n" + "="*60)
    print("Example 5: Integration Function")
    print("="*60)

    image_path = os.path.join(
        os.path.dirname(__file__),
        'data/food/ChIJ_3Ksr2x344kRvwN5KyrNiMc_3.jpg'
    )

    result = example_integration_function(image_path)

    print(f"\nResult structure:")
    for key, value in result.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("FOOD BINARY CLASSIFIER - USAGE EXAMPLES")
    print("="*60)

    example_single_image()
    example_batch_prediction()
    example_with_threshold()
    example_error_handling()
    example_integration()

    print("\n" + "="*60)
    print("All examples completed!")
    print("="*60 + "\n")
