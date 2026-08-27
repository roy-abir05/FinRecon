# FinRecon

### Mapping the Chaos of Modern Capital

**AI-assisted financial reconciliation for heterogeneous, messy financial data.**

FinRecon is an AI-powered finance controller that reconciles financial records across different systems, combining semantic schema understanding, deterministic matching, fuzzy matching, and targeted AI reasoning.

Built for the **Razorpay AI Buildathon — Track 04: AI Finance Controller**.

---

## The Problem

Modern financial systems rarely agree perfectly.

The same underlying money movement can appear in multiple systems:

```text
Order Ledger
      │
      ▼
Payment Gateway
      │
      ▼
Settlement Report
      │
      ▼
Bank Statement

```

But each system may represent it differently.

One system might contain:

```text
transaction_id | transaction_date | amount | customer_id

```

while another contains:

```text
txn_ref | txn_dt | gross_amt | client_no

```

and a bank statement might contain:

```text
value_date | narration | credit

```

The records may additionally differ because of:

- Different column names
- Different date formats
- Missing identifiers
- Transaction-to-settlement batching
- Processing fees
- Partial refunds
- Settlement delays
- Truncated references
- Typographical errors
- Duplicate amounts
- Ambiguous candidates

A simple database join cannot reliably reconcile these records.

A human can often recognize the relationship.

**FinRecon attempts to automate that reasoning — without pretending uncertainty does not exist.**

---

# What FinRecon Does

FinRecon closes one finance-operations loop:

> **Ingest → Understand → Normalize → Reconcile → Verify → Explain**

A user uploads financial exports from one or more systems.

FinRecon then:

1.  Understands the structure and semantics of each file
2.  Proposes mappings into a common financial schema
3.  Lets the user review and modify those mappings
4.  Normalizes the records deterministically
5.  Reconciles records using increasingly sophisticated matching strategies
6.  Sends only genuinely ambiguous cases to an AI reasoning layer
7.  Verifies the resulting matches
8.  Reports matched records and unresolved exceptions
9.  Measures the system against known ground truth

The goal is not to match everything.

> **The goal is to reconcile everything that can be justified, and clearly surface everything that cannot.**

---

# Product Flow

```text
                 ┌──────────────────────┐
                 │     Upload Files     │
                 │     CSV / XLSX       │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Schema Intelligence│
                 │                      │
                 │ Understand columns,  │
                 │ types & relationships│
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Review & Confirm   │
                 │                      │
                 │ User can modify the  │
                 │ proposed mappings    │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     Normalize        │
                 │                      │
                 │ Convert heterogeneous│
                 │ records to canonical │
                 │ financial entities   │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │  Reconciliation      │
                 │      Engine          │
                 └──────────┬───────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
           Exact          Rules         Fuzzy
          Matching       Matching      Matching
              │             │             │
              └─────────────┼─────────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │  Ambiguous Residual  │
                 │                      │
                 │   AI-assisted        │
                 │    resolution        │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     Verification     │
                 │                      │
                 │ Validate every match │
                 │ against constraints │
                 └──────────┬───────────┘
                            │
                   ┌────────┴────────┐
                   ▼                 ▼
              Reconciled         Exceptions
                Records             │
                   │                │
                   └───────┬────────┘
                           ▼
                  Results & Metrics

```

---

# AI Where It Actually Helps

FinRecon does **not** send every financial record to an LLM.

That would be expensive, slow, difficult to evaluate, and unnecessary.

Instead, AI is used at two points where semantic reasoning provides genuine value.

## 1. Schema Understanding

Different financial systems use different names for the same concept.

For example:

```text
txn_id
transaction_id
payment_ref
reference_no
bank_ref

```

may all represent some form of transaction reference.

FinRecon uses AI to propose a semantic mapping:

```text
Source Column       Canonical Field
--------------------------------------------
txn_id          →   transaction_reference
txn_dt          →   transaction_date
amt             →   gross_amount
cust_no         →   customer_id

```

The user can review and modify the mapping before processing begins.

### Important design principle

**The AI proposes. Deterministic code transforms.**

The model does not directly rewrite financial records.

Instead:

```text
Raw Column
    ↓
AI semantic interpretation
    ↓
Proposed mapping
    ↓
User confirmation
    ↓
Deterministic normalization

```

This keeps financial transformations reproducible and auditable.

---

# 2. Ambiguous Reconciliation

Most records should not require an LLM.

The reconciliation pipeline progressively eliminates easy cases.

```text
                All records
                     │
                     ▼
             Exact matching
                     │
                     ▼
             Rule-based match
                     │
                     ▼
           Candidate generation
                     │
                     ▼
             Fuzzy matching
                     │
                     ▼
             Ambiguous cases
                     │
                     ▼
              AI reasoning

```

The AI receives **structured candidate evidence**, not an arbitrary raw spreadsheet.

For example:

```text
Record
--------------------------------
Amount: ₹4,500
Date: 2026-08-21
Reference: RAZ-82731

Candidate A
--------------------------------
Amount: ₹4,500
Date: 2026-08-21
Reference similarity: 0.94

Candidate B
--------------------------------
Amount: ₹4,500
Date: 2026-08-22
Reference similarity: 0.61

```

The AI may resolve the ambiguity when the evidence supports a decision.

If the evidence is insufficient:

```text
UNRESOLVED

```

The system does not force a match.

---

# Canonical Financial Model

The system maps heterogeneous sources into a common representation.

The initial model will cover entities such as:

```text
Transaction
Payment
Settlement
Refund
BankTransaction

```

A canonical record may contain:

```text
Identifiers
Dates
Amounts
Currency
References
Customer / Entity information
Status
Source metadata

```

Not every source is expected to contain every field.

Missing information remains explicitly missing.

```json
{
  "transaction_reference": null,
  "amount": 4925.0,
  "currency": "INR",
  "transaction_date": "2026-08-28",
  "bank_reference": "RAZ...4921"
}
```

FinRecon never invents missing financial data simply to make a match possible.

---

# Reconciliation Strategies

## Exact Matching

Highest-confidence evidence:

- Exact identifiers
- Exact references
- Exact compatible amounts
- Exact known relationships

---

## Rule-Based Matching

Domain constraints handle cases that cannot be solved by direct joins.

Examples:

```text
net_amount = gross_amount - fees - refunds

```

```text
settlement_date >= transaction_date

```

```text
settlement_date - transaction_date <= allowed_window

```

```text
currency must be compatible

```

---

## Fuzzy Matching

For imperfect references and other noisy fields, FinRecon calculates candidate similarity using signals such as:

- Reference similarity
- Amount compatibility
- Date proximity
- Customer/entity similarity
- Currency
- Transaction status

Example:

```text
Candidate A    0.94
Candidate B    0.67
Candidate C    0.18

```

---

## AI-Assisted Resolution

Only the residual ambiguous cases reach the AI layer.

The AI receives structured evidence and returns a constrained decision:

```text
MATCH
or
UNRESOLVED

```

along with the evidence supporting the decision.

The AI cannot bypass hard financial constraints.

---

# Handling Real-World Messiness

FinRecon's benchmark data deliberately contains cases that break naive reconciliation.

### Many-to-One Settlements

```text
Order A ─┐
Order B ─┼──► Settlement
Order C ─┘

```

Multiple transactions may be bundled into one settlement.

---

### Fees

```text
Gross:       ₹10,000
Processing:  ₹150
Settlement:  ₹9,850

```

Matching solely on amount would fail.

---

### Timing Differences

```text
Transaction:  25 Aug
Settlement:   27 Aug
Bank credit:  28 Aug

```

Matching requires a temporal window.

---

### Corrupted References

```text
Original:  RAZORPAY-839217
Bank:      "...839217"

```

Exact string matching fails even though the relationship is obvious.

---

### Duplicate Amounts

```text
Transaction A    ₹5,000
Transaction B    ₹5,000

```

Amount alone is insufficient evidence.

---

### Partial Refunds

```text
Original payment:  ₹8,000
Refund:            ₹2,000
Net:               ₹6,000

```

The reconciliation engine must understand the relationship rather than treating these as unrelated amounts.

---

# Exceptions Are First-Class Results

A trustworthy reconciliation system must be comfortable saying:

> **"I don't know."**

Example:

```text
Exception #27

Amount: ₹2,000

Candidate A: 0.82
Candidate B: 0.81

Reason:
Both candidates have identical amounts and overlapping
settlement windows. Available references are insufficient
to distinguish them confidently.

Action:
Human review required.

```

This is not a failure of the system.

It is preferable to silently producing an incorrect financial reconciliation.

---

# Evaluation

The buildathon requires more than a convincing demo.

FinRecon will be evaluated against independently generated ground truth.

The benchmark will contain **50+ records**, with larger datasets used where practical.

We will measure:

Metric

Meaning

Match Rate

Percentage of records successfully reconciled

Precision

Percentage of predicted matches that are correct

Recall

Percentage of true matches recovered

Exception Rate

Percentage deliberately escalated

False Match Rate

Percentage of incorrect matches

Throughput

Records processed per unit time

AI Resolution Rate

Percentage requiring AI reasoning

The benchmark will be split across different difficulty levels rather than relying on a single cherry-picked dataset.

---

# Synthetic Data With Ground Truth

Because financial production data is private, the project uses synthetic data.

But the synthetic dataset is **not designed merely to make the algorithm look good**.

We generate a hidden ground-truth relationship:

```text
Transaction
      │
      ├── Payment
      │
      └── Settlement
              │
              ▼
        Bank Transaction

```

Then generate multiple system-specific views of those same events.

Noise and discrepancies are introduced independently:

```text
Ground Truth
      │
      ├──► Order Ledger
      │
      ├──► Payment Gateway
      │
      ├──► Settlement Report
      │
      └──► Bank Statement

```

The reconciliation engine only sees the observed records.

It does not receive the ground-truth mapping.

This allows the system's predictions to be compared against known truth.

---

# Architecture

```text
                         ┌────────────────────┐
                         │      Frontend      │
                         │ React + TypeScript │
                         │       + Vite       │
                         └─────────┬──────────┘
                                   │
                              REST / HTTP
                                   │
                                   ▼
                         ┌────────────────────┐
                         │      FastAPI       │
                         │       Backend      │
                         └─────────┬──────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
        File Ingestion       Schema Intelligence   Reconciliation
              │                    │                    │
              ▼                    ▼              ┌─────┴─────┐
         CSV / XLSX          AI Mapping            │           │
              │                    │             Exact       Fuzzy
              ▼                    │             Rules        │
        Normalization              │               │          │
              │                    │               └────┬─────┘
              └────────────────────┴────────────────────┤
                                                        ▼
                                                 AI Resolution
                                                        │
                                                        ▼
                                                  Verification
                                                        │
                                           ┌────────────┴────────────┐
                                           ▼                         ▼
                                       Matched                  Exceptions
                                           │                         │
                                           └────────────┬────────────┘
                                                        ▼
                                                   Results UI

```

---

# Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Python
- FastAPI
- Pydantic

### Data Processing

- Polars
- RapidFuzz
- NumPy
- scikit-learn where useful

### AI

Provider-agnostic LLM interface supporting structured outputs.

AI is primarily used for:

- Semantic schema inference
- Ambiguous reconciliation

### Storage

Initially designed to operate without persistent user accounts or databases.

Persistent storage can be introduced if required by the final product architecture.

### Deployment

Designed around free/low-cost infrastructure suitable for a public hackathon demonstration.

---

# Project Structure

```text
finrecon/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── lib/
│
├── backend/
│   ├── api/
│   ├── ingestion/
│   ├── schema/
│   ├── normalization/
│   ├── reconciliation/
│   │   ├── exact.py
│   │   ├── rules.py
│   │   ├── fuzzy.py
│   │   └── ai_resolver.py
│   ├── evaluation/
│   ├── models/
│   └── services/
│
├── data/
│   ├── generators/
│   ├── fixtures/
│   └── benchmarks/
│
├── tests/
│
├── docs/
│
├── .env.example
├── docker-compose.yml
├── README.md
└── LICENSE

```

---

# Roadmap

## Phase 1 — Core Engine

- [ ] Define canonical financial entities
- [ ] Build synthetic ground-truth generator
- [ ] Generate corrupted multi-source datasets
- [ ] Implement normalization
- [ ] Implement exact matching
- [ ] Implement rule-based matching
- [ ] Implement candidate generation
- [ ] Implement fuzzy matching
- [ ] Build evaluation harness

## Phase 2 — AI Layer

- [ ] AI-powered schema inference
- [ ] Human schema confirmation
- [ ] Structured AI resolver
- [ ] Confidence thresholds
- [ ] AI evidence/explanation generation
- [ ] Explicit unresolved state

## Phase 3 — Web Application

- [ ] File upload
- [ ] Dataset preview
- [ ] Schema mapping interface
- [ ] Reconciliation progress
- [ ] Results dashboard
- [ ] Match detail view
- [ ] Exception review interface
- [ ] Export reconciliation results

## Phase 4 — Benchmark & Polish

- [ ] 500+ record benchmark
- [ ] Difficulty-stratified evaluation
- [ ] Precision/recall measurement
- [ ] Throughput measurement
- [ ] Failure-case analysis
- [ ] Public deployment

- [ ] Demo video

- [ ] Buildathon submission

---

# Why This Project?

Financial reconciliation is a verification problem.

The interesting question isn't:

> "Can an LLM read a spreadsheet?"

It is:

> **"Can an automated system establish, with measurable confidence, that records from different financial systems represent the same underlying money movement?"**

LedgerGraph approaches that problem by combining:

**semantic understanding + deterministic systems + fuzzy matching + targeted AI reasoning + explicit uncertainty.**

The objective is not to make the AI appear infallible.

**The objective is to make its uncertainty useful.**

---

# Design Principles

### Deterministic before probabilistic

If a reliable rule can establish the answer, an LLM should not be involved.

### AI proposes; systems verify

AI outputs are structured, constrained, and validated by deterministic code.

### Missing data is missing evidence

The system does not invent values simply because a downstream operation expects them.

### Uncertainty is a valid output

An unresolved case is preferable to an unjustified match.

### Measure the system honestly

Aggregate match rates are not enough. Precision, recall, false matches, throughput, and exceptions all matter.

### Human review where it matters

Users can correct schema mappings and inspect ambiguous reconciliation decisions.

---

# The Core Idea

Financial reconciliation is fundamentally a **verification problem**.

The interesting question isn't:

> _Can an LLM read a spreadsheet?_

It is:

> **Can an automated system establish, with measurable confidence, that records from different financial systems represent the same underlying money movement?**

FinRecon combines:

**Semantic Understanding + Deterministic Systems + Fuzzy Matching + Targeted AI Reasoning + Explicit Uncertainty**

The objective is not to make the AI appear infallible.

### The objective is to make its uncertainty useful.

---

## Status

🚧 **Under active development**

Built for the **Razorpay AI Buildathon — Track 04: AI Finance Controller**.

**FinRecon — Mapping the Chaos of Modern Capital**
