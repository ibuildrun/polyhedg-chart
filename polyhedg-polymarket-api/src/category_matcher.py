"""
Category Matcher using OpenAI to match natural language queries to event categories.
"""
import json
import os
from typing import List, Dict, Any
from pathlib import Path
from openai import OpenAI


class CategoryMatcher:
    """Matches natural language prompts to relevant event categories using OpenAI."""
    
    def __init__(self, api_key: str = None):
        """
        Initialize the CategoryMatcher.
        
        Args:
            api_key: OpenAI API key. If not provided, will use OPENAI_API_KEY env var.
        """
        self.client = OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-oss-120b"
        
        # Load system prompt from file
        prompts_dir = Path(__file__).parent.parent / "prompts"
        system_prompt_file = prompts_dir / "system_prompt.txt"
        with open(system_prompt_file, 'r') as f:
            self.system_prompt = f.read()
    
    def match_categories(
        self, 
        user_query: str, 
        available_categories: List[str],
        max_categories: int = 10
    ) -> Dict[str, Any]:
        """
        Match a natural language query to relevant categories using OpenAI.
        
        Args:
            user_query: The natural language prompt describing what events to find
            available_categories: List of all available category tags
            max_categories: Maximum number of categories to return
            
        Returns:
            Dictionary containing:
                - categories: List of dicts with name, confidence, and reason for each
                - overall_confidence: Overall confidence score (0-1)
        """
        
        # Build user prompt
        user_prompt = f"""Query: "{user_query}"

Available categories: {json.dumps(available_categories)}

Return ALL relevant categories with confidence > 0.5. Format as JSON with:
- "categories": array of objects with "name", "confidence" (0-1), and "reason" for each
- "overall_confidence": overall confidence score (0-1)"""
        
        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            
            return {
                "categories": result.get("categories", []),
                "overall_confidence": result.get("overall_confidence", 0.0),
                "query": user_query
            }
            
        except Exception as e:
            return {
                "categories": [],
                "overall_confidence": 0.0,
                "query": user_query,
                "error": str(e)
            }


def load_categories_from_file(file_path: str) -> List[str]:
    """
    Load categories from a JSON file.
    
    Args:
        file_path: Path to the JSON file containing categories
        
    Returns:
        List of category strings
    """
    with open(file_path, 'r') as f:
        return json.load(f)

