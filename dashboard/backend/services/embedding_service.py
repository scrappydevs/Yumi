"""
Embedding service for generating and comparing food embeddings.
Used to build the food similarity graph.
"""
import numpy as np
from typing import List, Optional

# Lazy import to avoid loading model at startup (saves memory)
_sentence_transformer_model = None


def _get_model():
    """Lazy load the sentence transformer model only when needed."""
    global _sentence_transformer_model
    if _sentence_transformer_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print("[EMBEDDING] Loading sentence transformer model...")
            _sentence_transformer_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("[EMBEDDING] Model loaded successfully (dim=384)")
        except ImportError:
            print("[EMBEDDING WARNING] sentence-transformers not installed. Food graph feature disabled.")
            print("[EMBEDDING] Install with: pip install sentence-transformers")
            return None
        except Exception as e:
            print(f"[EMBEDDING ERROR] Failed to load model: {e}")
            return None
    return _sentence_transformer_model


class EmbeddingService:
    """Service for generating embeddings and calculating similarity."""
    
    def __init__(self):
        """Initialize the embedding service (model loads on first use)."""
        self.embedding_dim = 384
        print("[EMBEDDING] Service initialized (model will load on first use)")
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector from text description.
        
        Args:
            text: Food description text (dish + cuisine + description)
            
        Returns:
            List of floats representing the embedding vector
        """
        if not text or not text.strip():
            # Return zero vector for empty text
            return [0.0] * self.embedding_dim
        
        model = _get_model()  # Lazy load
        if model is None:
            # Model not available, return random vector for now
            print("[EMBEDDING] Model not available, using fallback")
            return (np.random.rand(self.embedding_dim) * 0.1).tolist()
        
        embedding = model.encode(text, show_progress_bar=False)
        return embedding.tolist()
    
    def generate_food_embedding(self, dish: str, cuisine: str, description: str) -> List[float]:
        """
        Generate embedding from structured food data.
        Combines dish, cuisine, and description into rich text.
        
        Args:
            dish: Name of the dish (e.g., "Spaghetti Carbonara")
            cuisine: Type of cuisine (e.g., "Italian")
            description: Detailed description
            
        Returns:
            Embedding vector as list of floats
        """
        # Create rich text representation
        text_parts = []
        
        if dish and dish != "Unknown Dish":
            text_parts.append(f"Dish: {dish}")
        
        if cuisine and cuisine != "Unknown":
            text_parts.append(f"Cuisine: {cuisine}")
        
        if description and description != "Analyzing...":
            text_parts.append(description)
        
        combined_text = ". ".join(text_parts)
        
        if not combined_text.strip():
            combined_text = "Unknown food item"
        
        return self.generate_embedding(combined_text)
    
    def calculate_similarity(self, emb1: List[float], emb2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            emb1: First embedding vector
            emb2: Second embedding vector
            
        Returns:
            Similarity score between 0 and 1
        """
        if not emb1 or not emb2:
            return 0.0
        
        emb1_arr = np.array(emb1)
        emb2_arr = np.array(emb2)
        
        # Handle zero vectors
        norm1 = np.linalg.norm(emb1_arr)
        norm2 = np.linalg.norm(emb2_arr)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        # Cosine similarity
        similarity = float(np.dot(emb1_arr, emb2_arr) / (norm1 * norm2))
        
        # Clamp to [0, 1] range
        return max(0.0, min(1.0, similarity))
    
    def batch_calculate_similarities(self, embeddings: List[List[float]]) -> List[List[float]]:
        """
        Calculate pairwise similarities for a batch of embeddings.
        
        Args:
            embeddings: List of embedding vectors
            
        Returns:
            2D list of similarity scores (symmetric matrix)
        """
        n = len(embeddings)
        similarities = [[0.0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(i, n):
                if i == j:
                    similarities[i][j] = 1.0
                else:
                    sim = self.calculate_similarity(embeddings[i], embeddings[j])
                    similarities[i][j] = sim
                    similarities[j][i] = sim
        
        return similarities


# Singleton instance
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    """Get or create embedding service instance."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service

