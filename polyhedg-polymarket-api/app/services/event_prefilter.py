"""
Pre-filter events before AI scoring to limit total count.
"""
from typing import List, Dict, Any
import random


def _parse_currency_string(value: str) -> float:
    """Parse currency string like '$31,631,203.71' to float."""
    if not value or value == "N/A":
        return 0.0
    try:
        # Remove $, commas, and convert to float
        return float(str(value).replace("$", "").replace(",", ""))
    except:
        return 0.0


def prefilter_events_by_category(
    events: List[Dict[str, Any]], 
    max_total: int = 25,
    prioritize_by: str = "volume",
    randomize: bool = True
) -> List[Dict[str, Any]]:
    """
    Pre-filter events to limit total count while maintaining category diversity.
    
    Strategy: Distribute events across categories, with optional randomization
    for variety.
    
    Args:
        events: List of events to filter
        max_total: Maximum total events to return
        prioritize_by: Field to sort by ("volume" or "liquidity")
        randomize: If True, adds randomness to selection
        
    Returns:
        Filtered list of events (max_total or fewer)
    """
    if len(events) <= max_total:
        return events
    
    # Group events by category
    category_groups = {}
    for event in events:
        category = event.get("category", "other")
        if category not in category_groups:
            category_groups[category] = []
        category_groups[category].append(event)
    
    # Sort events within each category by priority metric, then optionally randomize
    for category in category_groups:
        if randomize:
            # Take top 50% by volume, then randomize from that pool
            cat_events = category_groups[category]
            cat_events.sort(
                key=lambda e: _parse_currency_string(e.get("market_data", {}).get(prioritize_by, "0")),
                reverse=True
            )
            # Take top 50% and shuffle them for variety
            top_half_size = max(1, len(cat_events) // 2)
            top_half = cat_events[:top_half_size]
            random.shuffle(top_half)
            category_groups[category] = top_half + cat_events[top_half_size:]
        else:
            # Just sort by volume
            category_groups[category].sort(
                key=lambda e: _parse_currency_string(e.get("market_data", {}).get(prioritize_by, "0")),
                reverse=True
            )
    
    # Calculate how many events to take from each category
    num_categories = len(category_groups)
    base_per_category = max(1, max_total // num_categories)
    
    selected_events = []
    remaining = max_total
    
    # First pass: take base_per_category from each category
    for category, cat_events in category_groups.items():
        take = min(base_per_category, len(cat_events), remaining)
        selected_events.extend(cat_events[:take])
        remaining -= take
        
        if remaining <= 0:
            break
    
    # Second pass: fill remaining slots with highest priority events
    if remaining > 0:
        all_remaining = []
        for category, cat_events in category_groups.items():
            # Get events we haven't selected yet
            already_selected = sum(1 for e in selected_events if e.get("category") == category)
            all_remaining.extend(cat_events[already_selected:])
        
        # Sort all remaining by priority
        all_remaining.sort(
            key=lambda e: _parse_currency_string(e.get("market_data", {}).get(prioritize_by, "0")),
            reverse=True
        )
        
        selected_events.extend(all_remaining[:remaining])
    
    return selected_events[:max_total]

