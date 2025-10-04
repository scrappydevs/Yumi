# Food Binary Classifier

A binary classification model that determines whether an image contains food or not.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Running Inference

Use the `inference.py` module to classify images:

```python
from inference import FoodClassifier

# Initialize classifier
classifier = FoodClassifier()

# Classify a single image
label, confidence = classifier.predict('path/to/image.jpg')
print(f"Prediction: {label} (confidence: {confidence:.2%})")

# Classify multiple images
results = classifier.predict_batch(['image1.jpg', 'image2.jpg'])
```

Or run the example:
```bash
python inference.py
```

### Testing Accuracy

Test the model on the validation dataset:

```bash
python test_accuracy.py
```

This will:
- Test all images in `data/food/` and `data/not_food/`
- Compute accuracy, precision, recall, and F1-score
- Display a confusion matrix
- Show detailed results for each image

## Model Details

- **Input**: RGB images (automatically resized to model's input shape)
- **Output**: Binary classification (food vs not_food)
- **Model file**: `my_model.h5` (Keras/TensorFlow format)

## Directory Structure

```
food_binary_classifier/
├── my_model.h5           # Trained model
├── inference.py          # Inference module
├── test_accuracy.py      # Accuracy testing script
├── requirements.txt      # Python dependencies
├── README.md            # This file
└── data/
    ├── food/            # Food images for testing
    └── not_food/        # Non-food images for testing
```

## Output Example

```
================================================================================
FOOD BINARY CLASSIFIER - ACCURACY TEST
================================================================================

Testing 8 images from food/
================================================================================
✓ image1.jpg                    | Predicted: food       | Confidence: 98.50%
✓ image2.jpg                    | Predicted: food       | Confidence: 95.23%
...

Testing 4 images from not_food/
================================================================================
✓ image1.jpg                    | Predicted: not_food   | Confidence: 89.12%
...

================================================================================
SUMMARY
================================================================================

Overall Performance:
  Total Images: 12
  Total Correct: 11
  Total Incorrect: 1
  Overall Accuracy: 91.67%

Detailed Metrics (for 'food' class):
  Precision: 88.89%
  Recall: 100.00%
  F1-Score: 94.12%
```

