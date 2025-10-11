"""
AI-powered relevance scoring for events based on user query.
"""
import json
from typing import List, Dict, Any
from openai import OpenAI
import os


class RelevanceScorer:
    """Scores event relevance using OpenAI based on user query."""
    
    def __init__(self, api_key: str = None):
        """Initialize the RelevanceScorer."""
        self.client = OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4o-mini"
    
    def score_events(
        self, 
        events: List[Dict[str, Any]], 
        user_query: str
    ) -> List[Dict[str, Any]]:
        """
        Score events based on relevance to user query in ONE API call.
        
        Args:
            events: List of events to score (max 25)
            user_query: The user's search query
            
        Returns:
            List of events with relevance_score (0-100) added
        """
        if not events:
            return []
        
        # Create compact event representations for scoring
        event_summaries = []
        for idx, event in enumerate(events):
            summary = {
                "index": idx,
                "title": event.get("title", ""),
                "description": event.get("description", "")[:500]  # Limit description length
            }
            event_summaries.append(summary)
        
        # Build prompt with less strict scoring (out of 100)
        system_prompt = """You are an expert at analyzing prediction market events and determining their relevance to user queries.

Your task: Given a user's query and a list of events, score each event's relevance from 0 to 100.

Scoring guidelines (be generous and inclusive):
- 90-100: Directly answers the query, highly relevant
- 70-89: Very relevant, closely related to the topic
- 50-69: Moderately relevant, related or tangential
- 30-49: Somewhat relevant, loose connection
- 0-29: Not very relevant

IMPORTANT: Be generous with scores. If an event is even loosely related, give it at least 50+.

Return JSON with: {"scores": [{"index": 0, "score": 85, "reason": "brief explanation"}, ...]}"""

        user_prompt = f"""User Query: "{user_query}"

Events to score:
{json.dumps(event_summaries, indent=2)}

Score each event's relevance to the query (0-100). Be generous - include loosely related events. Return JSON with scores array."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            scores_data = result.get("scores", [])
            
            # Add scores to events
            scored_events = []
            for score_info in scores_data:
                idx = score_info.get("index")
                if idx is not None and idx < len(events):
                    event = events[idx].copy()
                    event["relevance_score"] = score_info.get("score", 50)  # Default 50 out of 100
                    event["relevance_reason"] = score_info.get("reason", "")
                    scored_events.append(event)
            
            return scored_events
            
        except Exception as e:
            print(f"Error scoring events: {e}")
            # If scoring fails, add events with default score
            scored_events = []
            for event in events:
                event_copy = event.copy()
                event_copy["relevance_score"] = 50  # Default 50 out of 100
                event_copy["relevance_reason"] = "Scoring failed"
                scored_events.append(event_copy)
            return scored_events


def limit_events_per_category(
    events: List[Dict[str, Any]], 
    max_per_category: int = 10
) -> List[Dict[str, Any]]:
    """
    Limit the number of events per category, keeping highest scored ones.
    
    Args:
        events: List of events with relevance_score
        max_per_category: Maximum events to keep per category
        
    Returns:
        Filtered list of events
    """
    # Sort by relevance score (highest first)
    sorted_events = sorted(events, key=lambda e: e.get("relevance_score", 0), reverse=True)
    
    # Group by category and limit
    category_counts = {}
    filtered_events = []
    
    for event in sorted_events:
        category = event.get("category", "other")
        count = category_counts.get(category, 0)
        
        if count < max_per_category:
            filtered_events.append(event)
            category_counts[category] = count + 1
    
    return filtered_events


