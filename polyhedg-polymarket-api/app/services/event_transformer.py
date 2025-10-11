"""
Transform PolyMarket events into simplified frontend-friendly format.
"""
from typing import List, Dict, Any, Optional


def transform_event_to_simplified(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform a PolyMarket event into simplified format.
    
    Args:
        event: Raw PolyMarket event data
        
    Returns:
        Simplified event structure for frontend
    """
    # Get primary market (first one or the one with most volume)
    markets = event.get("markets", [])
    primary_market = None
    
    if markets:
        # Use market with highest volume as primary
        try:
            primary_market = max(markets, key=lambda m: float(m.get("volume") or 0))
        except:
            # If that fails, just use the first one
            primary_market = markets[0] if markets else None
    
    # Extract prices
    yes_price = None
    no_price = None
    yes_percentage = 50.0
    no_percentage = 50.0
    
    if primary_market and primary_market.get("outcomePrices"):
        try:
            prices = eval(primary_market["outcomePrices"])  # Convert string to list
            if len(prices) >= 2:
                yes_price = float(prices[0]) if prices[0] is not None else None
                no_price = float(prices[1]) if prices[1] is not None else None
                if yes_price is not None:
                    yes_percentage = yes_price * 100
                    no_percentage = (1 - yes_price) * 100 if yes_price <= 1 else 0
        except Exception as e:
            # If parsing fails, try to use lastTradePrice
            try:
                last_price = primary_market.get("lastTradePrice")
                if last_price is not None:
                    yes_price = float(last_price)
                    yes_percentage = yes_price * 100
                    no_percentage = 100 - yes_percentage
            except:
                pass
    
    # Determine type based on yes probability
    event_type = "neutral"
    if yes_percentage > 60:
        event_type = "positive"
    elif yes_percentage < 40:
        event_type = "negative"
    
    # Calculate value and change
    value = f"{yes_percentage:.1f}% Yes"
    
    # Try to get 24hr change from volume data
    change = None
    if primary_market:
        last_price = primary_market.get("lastTradePrice")
        if last_price:
            change = f"${last_price:.2f}"
    
    # Get primary category from tags
    tags = event.get("tags", [])
    category = "other"
    tag_labels = []
    if tags:
        category = tags[0].get("label", "other").lower()
        tag_labels = [tag.get("label", "") for tag in tags if tag.get("label")]
    
    # Determine size based on volume
    volume = event.get("volume", 0)
    volume = float(volume) if volume else 0.0
    size = "small"
    if volume > 100000:
        size = "large"
    elif volume > 10000:
        size = "medium"
    
    return {
        "id": event.get("id", ""),
        "title": event.get("title", ""),
        "description": event.get("description", ""),
        "value": value,
        "change": change,
        "type": event_type,
        "selected": False,  # Can be set based on criteria
        "size": size,
        "category": category,
        "market_data": {
            "volume": f"${float(event.get('volume') or 0):,.2f}",
            "liquidity": f"${float(event.get('liquidity') or 0):,.2f}",
            "yes_price": f"${yes_price:.2f}" if yes_price else "N/A",
            "no_price": f"${no_price:.2f}" if no_price else "N/A",
            "yes_percentage": yes_percentage,
            "no_percentage": no_percentage,
            "volume_24hr": f"${float(event.get('volume24hr') or 0):,.2f}",
            "comment_count": event.get("commentCount") or 0
        },
        "dates": {
            "start_date": event.get("startDate", ""),
            "end_date": event.get("endDate", ""),
            "created_at": event.get("startDate", "")
        },
        "metadata": {
            "image_url": event.get("image", ""),
            "icon_url": event.get("icon", ""),
            "market_url": f"https://polymarket.com/event/{event.get('slug', '')}",
            "slug": event.get("slug", ""),
            "ticker": event.get("ticker", ""),
            "tags": tag_labels,
            "active": event.get("active", False),
            "closed": event.get("closed", False),
            "markets_count": len(markets)
        }
    }


def transform_events_batch(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Transform multiple events at once.
    
    Args:
        events: List of raw PolyMarket events
        
    Returns:
        List of simplified events
    """
    return [transform_event_to_simplified(event) for event in events]

