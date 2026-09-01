import pandas as pd
import random
from datetime import timedelta
from faker import Faker
import os

fake = Faker('en_IN')
Faker.seed(42)
random.seed(42)

def generate_datasets(num_records=60):
    orders, gateway, bank = [], [], []
    
    for i in range(num_records):
        # 1. Base Ground Truth
        order_id = f"O-{1000 + i}"
        base_date = fake.date_between(start_date="-30d", end_date="today")
        amount = round(random.uniform(1000.0, 25000.0), 2)
        gateway_ref = f"pay_{fake.uuid4()[:8].upper()}"
        
        # Calculate fees (2% + flat 5)
        fee = round((amount * 0.02) + 5, 2)
        net_amt = round(amount - fee, 2)

        # 2. Determine Corruption Profile
        profile = random.random()
        
        if profile < 0.70:
            # Type A: Perfect Match (70%)
            bank_date = base_date
            bank_narration = f"SETTLE-{gateway_ref} TRF"
            
        elif profile < 0.90:
            # Type B: Mangled Reference & Timing Delay (20%)
            bank_date = base_date + timedelta(days=random.randint(1, 3))
            stripped_ref = gateway_ref.split("_")[1] # drops the 'pay_'
            bank_narration = f"NEFT/RZP/{stripped_ref}/FUNDS"
            
        else:
            # Type C: Ambiguous / Missing Reference (10% - AI Bait)
            bank_date = base_date + timedelta(days=random.randint(0, 2))
            bank_narration = f"MISC CR {net_amt}"

        # 3. Append to system views
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
        
        bank.append({
            "value_date": bank_date,
            "narration": bank_narration,
            "credit": net_amt
        })

    return pd.DataFrame(orders), pd.DataFrame(gateway), pd.DataFrame(bank)

if __name__ == "__main__":
    orders_df, gateway_df, bank_df = generate_datasets(60)

    orders_df.to_csv("data/orders.csv", index=False)
    gateway_df.to_csv("data/gateway.csv", index=False)
    bank_df.to_csv("data/bank.csv", index=False)
    
    print(f"Generated 60 synthetic records in data/ directory.")