#!/usr/bin/env python3
"""
Generate association rules for book recommendations using FP-Growth.

This script fetches historical order transactions, applies the FP-Growth
algorithm (an optimized version of Apriori) to find frequent itemsets,
computes association rules (support, confidence, lift), and stores
the generated rules back into the database for real-time serving 
during the checkout process.

Usage:
    cd data
    python scripts/generate_association_rules.py --min-support 0.01 --min-confidence 0.1
"""

import sys
import argparse
from pathlib import Path
from collections import defaultdict

# Backend path processing (2 levels up)
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.order import Order, OrderItem, OrderStatus
from app.models.association_rule import AssociationRule
from app.models.book import Book

try:
    import pandas as pd
    from mlxtend.preprocessing import TransactionEncoder
    from mlxtend.frequent_patterns import fpgrowth, association_rules
except ImportError:
    print("Error: mlxtend or pandas is not installed.")
    print("Run: pip install mlxtend pandas")
    sys.exit(1)


def generate_rules(min_support=0.01, min_confidence=0.1):
    db = SessionLocal()
    try:
        print("Fetching transactions from the database...")
        # Get all completed orders (not cancelled)
        valid_orders = db.query(Order).filter(Order.status != OrderStatus.CANCELLED).all()
        valid_order_ids = set([str(o.id) for o in valid_orders])
        
        # Get order items for valid orders
        order_items = db.query(OrderItem).all()
        
        # Group items by order_id to form baskets
        baskets_dict = defaultdict(list)
        for item in order_items:
            # We only concern ourselves with items linked to valid books and orders
            if item.book_id and str(item.order_id) in valid_order_ids:
                baskets_dict[str(item.order_id)].append(str(item.book_id))
        
        # Filter out baskets with fewer than 2 items (cannot form rules from size 1)
        baskets = [basket for basket in baskets_dict.values() if len(basket) > 1]
        
        if len(baskets) == 0:
            print("Not enough transactions with multiple items to generate rules.")
            return
            
        print(f"Found {len(baskets)} valid multi-item transactions. Processing...")
        
        # 1. One-Hot Encode the baskets
        te = TransactionEncoder()
        te_ary = te.fit(baskets).transform(baskets)
        df = pd.DataFrame(te_ary, columns=te.columns_)
        
        # 2. Extract frequent itemsets using FP-Growth
        print(f"Running FP-Growth with min_support={min_support}...")
        frequent_itemsets = fpgrowth(df, min_support=min_support, use_colnames=True)
        
        if frequent_itemsets.empty:
            print("No frequent itemsets found. Try entirely lowering min_support.")
            return
            
        # 3. Generate Association Rules
        print(f"Generating rules with min_confidence={min_confidence}...")
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_confidence, num_itemsets=len(baskets))
        
        # Filter for Lift > 1.0 to ensure positive correlation
        rules = rules[rules['lift'] > 1.0]
        
        if rules.empty:
            print("No rules found meeting criteria. Try lowering min_confidence.")
            return
            
        print(f"Generated {len(rules)} association rules. Saving to database...")
        
        # 4. Save to Database
        # Clear existing rules first
        db.query(AssociationRule).delete()
        db.commit()
        
        rules_added = 0
        for _, row in rules.iterrows():
            antecedents = list(row['antecedents'])
            consequents = list(row['consequents'])
            
            # For simplicity in serving, we limit to 1-to-1 rules in the DB.
            # E.g., if multiple items lead to a consequent, we just use 1-to-1 pairs.
            for antecedent in antecedents:
                for consequent in consequents:
                    new_rule = AssociationRule(
                        antecedent_id=antecedent,
                        consequent_id=consequent,
                        support=float(row['support']),
                        confidence=float(row['confidence']),
                        lift=float(row['lift'])
                    )
                    db.add(new_rule)
                    rules_added += 1
        
        db.commit()
        print(f"Successfully saved {rules_added} derived 1-to-1 rules to the database!")
        
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate book association rules.")
    parser.add_argument("--min-support", type=float, default=0.01, 
                        help="Minimum support threshold (e.g. 0.01 for 1 percent)")
    parser.add_argument("--min-confidence", type=float, default=0.1, 
                        help="Minimum confidence threshold (e.g. 0.1 for 10 percent)")
    
    args = parser.parse_args()
    generate_rules(min_support=args.min_support, min_confidence=args.min_confidence)
