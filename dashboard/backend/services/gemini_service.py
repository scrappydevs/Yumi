"""
Google Gemini AI service for analyzing food images.
"""
import google.generativeai as genai
import os
from typing import Optional
from PIL import Image
import io


class GeminiService:
    """Service for interacting with Google Gemini API."""
    
    # Allowed cuisine types
    ALLOWED_CUISINES = {
        "American", "Italian", "French", "Chinese", "Japanese", "Mexican", "Indian", "Thai", 
        "Greek", "Spanish", "Korean", "Vietnamese", "Lebanese", "Turkish", "Moroccan", 
        "Ethiopian", "Brazilian", "Peruvian", "Jamaican", "Cuban", "German", "Polish", 
        "Russian", "Swedish", "Portuguese", "Filipino", "Malaysian", "Indonesian", 
        "Singaporean", "Egyptian", "Iranian", "Afghan", "Nepalese", "Burmese", 
        "Cambodian", "Georgian", "Armenian", "Argentinian", "Colombian", "Venezuelan", 
        "Chilean", "Ecuadorian", "Bolivian", "Uruguayan", "Paraguayan", "Hungarian", 
        "Austrian", "Swiss", "Belgian", "Dutch", "Danish", "Norwegian", "Finnish", "Icelandic"
    }
    
    def __init__(self):
        """Initialize Gemini with API key from environment."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        genai.configure(api_key=api_key)
        # Use latest stable Gemini Flash model (supports vision + generateContent)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def analyze_food_image(self, image_bytes: bytes) -> dict:
        """
        Send image to Gemini for analysis of food/cuisine.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Dictionary with 'dish', 'cuisine', and 'description' keys
            
        Raises:
            Exception: If Gemini API call fails
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Create prompt for structured food analysis
            prompt = """Analyze this food image and provide:
1. DISH: The specific name of the dish or food item (e.g., "Spaghetti Carbonara", "California Roll", "Chocolate Cake")
2. CUISINE: The type of cuisine - MUST be EXACTLY ONE from this list:
   American, Italian, French, Chinese, Japanese, Mexican, Indian, Thai, Greek, Spanish, Korean, Vietnamese, Lebanese, Turkish, Moroccan, Ethiopian, Brazilian, Peruvian, Jamaican, Cuban, German, Polish, Russian, Swedish, Portuguese, Filipino, Malaysian, Indonesian, Singaporean, Egyptian, Iranian, Afghan, Nepalese, Burmese, Cambodian, Georgian, Armenian, Argentinian, Colombian, Venezuelan, Chilean, Ecuadorian, Bolivian, Uruguayan, Paraguayan, Hungarian, Austrian, Swiss, Belgian, Dutch, Danish, Norwegian, Finnish, Icelandic
3. DESCRIPTION: A brief 1-2 sentence description including key ingredients and presentation

Format your response EXACTLY as:
DISH: [dish name]
CUISINE: [one cuisine from the list above]
DESCRIPTION: [description]

IMPORTANT: For CUISINE, you MUST select EXACTLY ONE word from the cuisine list provided. Do not use any other cuisine names."""

            # Call Gemini API with vision
            response = self.model.generate_content([prompt, image])
            
            # Extract text from response
            if response.text:
                text = response.text.strip()
                
                # Parse the structured response
                result = {
                    'dish': 'Unknown Dish',
                    'cuisine': 'Unknown',
                    'description': text
                }
                
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('DISH:'):
                        result['dish'] = line.replace('DISH:', '').strip()
                    elif line.startswith('CUISINE:'):
                        cuisine = line.replace('CUISINE:', '').strip()
                        # Validate cuisine is in allowed list
                        if cuisine in self.ALLOWED_CUISINES:
                            result['cuisine'] = cuisine
                        else:
                            # Try case-insensitive match
                            for allowed_cuisine in self.ALLOWED_CUISINES:
                                if cuisine.lower() == allowed_cuisine.lower():
                                    result['cuisine'] = allowed_cuisine
                                    break
                            else:
                                # If still not found, default to Unknown
                                print(f"Warning: Gemini returned invalid cuisine '{cuisine}', defaulting to 'Unknown'")
                                result['cuisine'] = 'Unknown'
                    elif line.startswith('DESCRIPTION:'):
                        result['description'] = line.replace('DESCRIPTION:', '').strip()
                
                return result
            else:
                return {
                    'dish': 'Unknown Dish',
                    'cuisine': 'Unknown',
                    'description': 'Unable to analyze food image'
                }

        except Exception as e:
            print(f"Gemini API error: {str(e)}")
            raise Exception(f"Failed to analyze food image: {str(e)}")

    def analyze_food_with_restaurant_matching(self, image_bytes: bytes, nearby_restaurants: list) -> dict:
        """
        Analyze food image and match to nearby restaurant.
        
        Args:
            image_bytes: Raw image bytes
            nearby_restaurants: List of nearby restaurant dicts from Places API
            
        Returns:
            Dictionary with 'dish', 'cuisine', 'description', 'restaurant'
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            # Format restaurant list
            if nearby_restaurants:
                restaurant_list = "\n".join([
                    f"{i+1}. {r['name']} - {r['cuisine']} ({r['rating']}⭐)"
                    for i, r in enumerate(nearby_restaurants)
                ])
            else:
                restaurant_list = "No nearby restaurants found"
            
            prompt = f"""Analyze this food image and match it to a nearby restaurant.

NEARBY RESTAURANTS:
{restaurant_list}

TASK:
1. Identify the DISH/FOOD name
2. Identify the CUISINE/FOOD type - MUST be from this list: {', '.join(sorted(self.ALLOWED_CUISINES))}
3. Using the above answers, match to the MOST LIKELY restaurant from the list above
4. Provide brief DESCRIPTION

MATCHING RULES:
- Fast food (paper containers, simple packaging) → match to fast food chains
- Upscale plating (artistic, fine china) → match to higher-rated restaurants
- Drink item → match to cafe/gas station
- Match cuisine type to restaurant cuisine
- Homemade food → return "Unknown" for restaurant
- If unsure or not a food item → return "Unknown"

FORMAT:
DISH: [dish name]
CUISINE: [cuisine from list]
RESTAURANT: [exact name from list, or "Unknown"]
DESCRIPTION: [brief description]

Be specific. If unsure about restaurant, say "Unknown"."""

            response = self.model.generate_content([prompt, image])
            
            if response.text:
                text = response.text.strip()
                print(f"[GEMINI] Response:\n{text}")
                
                result = {
                    'dish': 'Unknown Dish',
                    'cuisine': 'Unknown',
                    'restaurant': 'Unknown',
                    'description': text
                }
                
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('DISH:'):
                        result['dish'] = line.replace('DISH:', '').strip()
                    elif line.startswith('CUISINE:'):
                        cuisine = line.replace('CUISINE:', '').strip()
                        if cuisine in self.ALLOWED_CUISINES:
                            result['cuisine'] = cuisine
                        else:
                            for allowed_cuisine in self.ALLOWED_CUISINES:
                                if cuisine.lower() == allowed_cuisine.lower():
                                    result['cuisine'] = allowed_cuisine
                                    break
                    elif line.startswith('RESTAURANT:'):
                        restaurant = line.replace('RESTAURANT:', '').strip()
                        if restaurant != "Unknown":
                            # Fuzzy match to nearby restaurants
                            for r in nearby_restaurants:
                                if restaurant.lower() in r['name'].lower() or r['name'].lower() in restaurant.lower():
                                    result['restaurant'] = r['name']
                                    break
                            else:
                                result['restaurant'] = restaurant  # Use as-is if no match
                        else:
                            result['restaurant'] = 'Unknown'
                    elif line.startswith('DESCRIPTION:'):
                        result['description'] = line.replace('DESCRIPTION:', '').strip()
                
                print(f"[GEMINI] Parsed: dish={result['dish']}, cuisine={result['cuisine']}, restaurant={result['restaurant']}")
                return result
            else:
                return {
                    'dish': 'Unknown Dish',
                    'cuisine': 'Unknown',
                    'restaurant': 'Unknown',
                    'description': 'Unable to analyze'
                }
        except Exception as e:
            print(f"[GEMINI ERROR] {str(e)}")
            raise Exception(f"Failed to analyze with restaurant matching: {str(e)}")


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create Gemini service instance."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service

