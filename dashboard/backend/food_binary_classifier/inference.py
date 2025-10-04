"""
Food Binary Classifier - Inference Module

This module provides inference capabilities for the food binary classifier model.
It loads the trained model and provides methods to classify images as food or not_food.
"""

import os
import numpy as np
from PIL import Image
from tensorflow import keras
from typing import Tuple, Union
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FoodClassifier:
    """
    A binary classifier that determines if an image contains food or not.
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize the FoodClassifier with a trained model.
        
        Args:
            model_path: Path to the .h5 model file. If None, uses default path.
        """
        if model_path is None:
            # Default to the model in the same directory
            model_path = os.path.join(os.path.dirname(__file__), 'my_model.h5')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at: {model_path}")
        
        logger.info(f"Loading model from: {model_path}")
        self.model = keras.models.load_model(model_path)
        logger.info("Model loaded successfully")
        
        # Get input shape from model
        self.input_shape = self.model.input_shape[1:3]  # (height, width)
        logger.info(f"Model input shape: {self.input_shape}")
        
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess an image for model inference.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Preprocessed image as numpy array ready for model input
        """
        try:
            # Load image
            img = Image.open(image_path)
            
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to model input shape
            img = img.resize(self.input_shape)
            
            # Convert to array and normalize
            img_array = np.array(img, dtype=np.float32)
            img_array = img_array / 255.0  # Normalize to [0, 1]
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            return img_array
            
        except Exception as e:
            logger.error(f"Error preprocessing image {image_path}: {e}")
            raise
    
    def predict(self, image_path: str) -> Tuple[str, float]:
        """
        Classify a single image as food or not_food.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Tuple of (prediction_label, confidence_score)
            where prediction_label is either 'food' or 'not_food'
        """
        # Preprocess image
        img_array = self.preprocess_image(image_path)
        
        # Make prediction
        prediction = self.model.predict(img_array, verbose=0)[0][0]
        
        # Convert to label and confidence
        # Assuming model outputs: 0 = not_food, 1 = food
        if prediction >= 0.5:
            label = 'food'
            confidence = float(prediction)
        else:
            label = 'not_food'
            confidence = float(1 - prediction)
        
        return label, confidence
    
    def predict_batch(self, image_paths: list) -> list:
        """
        Classify multiple images at once.
        
        Args:
            image_paths: List of paths to image files
            
        Returns:
            List of tuples (image_path, prediction_label, confidence_score)
        """
        results = []
        
        for image_path in image_paths:
            try:
                label, confidence = self.predict(image_path)
                results.append((image_path, label, confidence))
                logger.info(f"{os.path.basename(image_path)}: {label} ({confidence:.2%})")
            except Exception as e:
                logger.error(f"Error processing {image_path}: {e}")
                results.append((image_path, 'error', 0.0))
        
        return results


def main():
    """
    Example usage of the FoodClassifier.
    """
    # Initialize classifier
    classifier = FoodClassifier()
    
    # Example: classify a single image
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    
    # Test on a food image
    food_dir = os.path.join(data_dir, 'food')
    if os.path.exists(food_dir):
        food_images = [os.path.join(food_dir, f) for f in os.listdir(food_dir) 
                      if f.endswith(('.jpg', '.jpeg', '.png'))]
        if food_images:
            print("\n=== Testing on FOOD images ===")
            classifier.predict_batch(food_images[:3])  # Test first 3
    
    # Test on a not_food image
    not_food_dir = os.path.join(data_dir, 'not_food')
    if os.path.exists(not_food_dir):
        not_food_images = [os.path.join(not_food_dir, f) for f in os.listdir(not_food_dir) 
                          if f.endswith(('.jpg', '.jpeg', '.png'))]
        if not_food_images:
            print("\n=== Testing on NOT_FOOD images ===")
            classifier.predict_batch(not_food_images[:3])  # Test first 3


if __name__ == "__main__":
    main()

