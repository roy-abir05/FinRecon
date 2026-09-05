import pandas as pd
import random
import argparse
from datetime import timedelta
from faker import Faker
import os

def generate_datasets(num_records=100, seed=None):
    fake = Faker('en_IN')
    if seed:
        Faker.seed(seed)
        random.seed(seed)
        
    orders, gateway, bank = [], [], []
    
    stats = {"perfect": 0, "rounding": 0, "drift": 0, "mangled": 0, "dropped": 0, "orphans": 0}
    
    for i in range(num_records):
        order_id = f"O-{1000 + i}"
        base_date = fake.date_between(start_date="-30d", end_date="today")
        amount = round(random.uniform(1000.0, 25000.0), 2)
        gateway_ref = f"pay_{fake.uuid4()[:8].upper()}"
        
        # Razorpay fee simulation (2% + flat 5)
        fee = round((amount * 0.02) + 5, 2)
        net_amt = round(amount - fee, 2)

        orders.append({
            "order_id": order_id,
            "order_date": base_date,
            "amount": amount,
            "customer_id": f"C-{fake.random_int(min=100, max=999)}"
        })
        
        gateway.append({
            "txn_ref": gateway_ref,
            "linked_order": order_id,
            "settled_at": base_date,
            "gross_amt": amount,
            "fee": fee,
            "net_amt": net_amt
        })

        profile = random.random()
        
        if profile < 0.70:
            # Perfect Match (70%)
            bank.append({
                "value_date": base_date,
                "narration": f"SETTLE-{gateway_ref} TRF",
                "credit": net_amt
            })
            stats["perfect"] += 1
            
        elif profile < 0.75:
            # The Rounding Error, Off by 1 to 5 cents
            noise = round(random.choice([-0.05, -0.02, 0.02, 0.04]), 2)
            bank.append({
                "value_date": base_date,
                "narration": f"SETTLE-{gateway_ref} TRF",
                "credit": round(net_amt + noise, 2)
            })
            stats["rounding"] += 1
            
        elif profile < 0.85:
            # The T+2 Weekend Drift (10% - AI Resolver catches this)
            drift = random.choice([2, 3]) # Arrives 2-3 days late
            bank.append({
                "value_date": base_date + timedelta(days=drift),
                "narration": f"SETTLE-{gateway_ref} TRF",
                "credit": net_amt
            })
            stats["drift"] += 1
            
        elif profile < 0.95:
            # Only keeps the first 4 characters of the UUID
            stripped_ref = gateway_ref.split("_")[1][:4] 
            bank.append({
                "value_date": base_date,
                "narration": f"NEFT/RZP/{stripped_ref}/FUNDS",
                "credit": net_amt
            })
            stats["mangled"] += 1
            
        else:
            # Money never hits the bank. We simply DO NOT append to the bank list.
            stats["dropped"] += 1

    # Inject a few completely random bank credits that have no matching order
    num_orphans = max(1, int(num_records * 0.03)) # 3% of total volume
    for _ in range(num_orphans):
        bank.append({
            "value_date": fake.date_between(start_date="-30d", end_date="today"),
            "narration": f"IMPS-UNKNOWN-CLIENT-{fake.random_int(1000,9999)}",
            "credit": round(random.uniform(5000.0, 50000.0), 2)
        })
        stats["orphans"] += 1

    random.shuffle(bank)

    return pd.DataFrame(orders), pd.DataFrame(gateway), pd.DataFrame(bank), stats

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FinRecon Synthetic Data Generator")
    parser.add_argument("--count", type=int, default=100, help="Number of records to generate")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducible chaos")
    args = parser.parse_args()

    orders_df, gateway_df, bank_df, stats = generate_datasets(args.count, args.seed)

    orders_df.to_csv("orders.csv", index=False)
    gateway_df.to_csv("gateway.csv", index=False)
    bank_df.to_csv("bank.csv", index=False)
    
    print(f"\n[SUCCESS] Generated {args.count} synthetic records in data/ directory.\n")
    print("--- CHAOS REPORT ---")
    print(f"✅ Perfect Matches:      {stats['perfect']}")
    print(f"✨ AI Target (Rounding): {stats['rounding']}")
    print(f"✨ AI Target (T+2 Date): {stats['drift']}")
    print(f"✨ AI Target (Mangled):  {stats['mangled']}")
    print(f"⚠️ Missing from Bank:   {stats['dropped']}")
    print(f"⚠️ Orphan Bank Credits: {stats['orphans']}")
    print("--------------------\n")