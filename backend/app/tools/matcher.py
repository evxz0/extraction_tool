from typing import List, Dict, Any, Optional
import math


class SubsetItem:
    def __init__(self, id: Any, amount: float, label: str = ""):
        self.id = id
        self.amount = round(amount, 2)
        self.label = label or f"Item {id}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "amount": self.amount,
            "label": self.label
        }


def solve_subset_sum(
    target_amount: float,
    items: List[Dict[str, Any]],
    max_combinations: int = 10,
    tolerance: float = 0.01
) -> Dict[str, Any]:
    """
    Find combinations of items that sum up to target_amount using recursive backtracking.
    Also computes closest match if no exact match is found.
    """
    target = round(target_amount, 2)
    parsed_items: List[SubsetItem] = []

    for idx, itm in enumerate(items, 1):
        amt = float(itm.get("amount", 0))
        lbl = str(itm.get("label") or itm.get("description") or f"Tx #{idx}")
        item_id = itm.get("id", idx)
        if amt > 0:
            parsed_items.append(SubsetItem(id=item_id, amount=amt, label=lbl))

    # Sort descending for better branch pruning
    parsed_items.sort(key=lambda x: x.amount, reverse=True)

    exact_matches: List[Dict[str, Any]] = []
    closest_match: Optional[Dict[str, Any]] = None
    min_diff = float("inf")

    def backtrack(index: int, current_sum: float, current_items: List[SubsetItem]):
        nonlocal min_diff, closest_match

        current_sum = round(current_sum, 2)
        diff = round(abs(target - current_sum), 2)

        # Track closest match
        if diff < min_diff and len(current_items) > 0:
            min_diff = diff
            closest_match = {
                "items": [itm.to_dict() for itm in current_items],
                "total_amount": current_sum,
                "difference": round(current_sum - target, 2),
                "is_exact": diff <= tolerance,
                "item_count": len(current_items)
            }

        # Exact match check
        if diff <= tolerance:
            exact_matches.append({
                "items": [itm.to_dict() for itm in current_items],
                "total_amount": current_sum,
                "difference": 0.0,
                "is_exact": True,
                "item_count": len(current_items)
            })
            if len(exact_matches) >= max_combinations:
                return
            # Continue search for alternative combinations

        if index >= len(parsed_items) or len(exact_matches) >= max_combinations:
            return

        # Prune if already exceeding target
        if current_sum > target and target > 0:
            return

        for i in range(index, len(parsed_items)):
            item = parsed_items[i]
            # Choose item
            current_items.append(item)
            backtrack(i + 1, current_sum + item.amount, current_items)
            # Backtrack
            current_items.pop()

            if len(exact_matches) >= max_combinations:
                break

    backtrack(0, 0.0, [])

    total_pool_sum = round(sum(itm.amount for itm in parsed_items), 2)

    return {
        "target_amount": target,
        "total_pool_amount": total_pool_sum,
        "total_items_provided": len(parsed_items),
        "found_exact": len(exact_matches) > 0,
        "match_count": len(exact_matches),
        "exact_matches": exact_matches,
        "closest_match": closest_match if not exact_matches else None
    }
