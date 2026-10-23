# DA3 — Neo4j Graph Integration

> **Assignment:** DA3 | **Course:** Database Management Systems  
> **Project:** LifeFlow Blood Bank — Neo4j AuraDB Graph Layer

---

## Overview

This folder contains the complete **DA3 Neo4j** component of the LifeFlow Blood Bank Management System.  
It implements a **graph projection** of the relational MySQL data into **Neo4j AuraDB**, enabling blood-unit traceability, donor lineage queries, and relationship-based analytics.

**This project is isolated from the Blood Bank MySQL backend.** All source files here are self-contained copies.

---

## Folder Structure

```
DA3_Neo4j/
├── config/
│   └── neo4j.js                    # Neo4j AuraDB driver initialization & helpers
├── controllers/
│   └── graphController.js          # Express route handlers for graph API endpoints
├── routes/
│   └── graphRoutes.js              # REST route definitions for /api/graph/*
├── services/
│   └── graphSyncService.js         # Core sync logic: MySQL → Neo4j projection
├── scripts/
│   ├── diagnose_neo4j.js           # Read-only connectivity & graph state diagnostic
│   ├── verify_connectivity.js      # Quick connectivity check
│   ├── test_neo4j_integration.js   # Full integration test suite (requires server running)
│   ├── test_graph_endpoints.js     # API endpoint smoke tests
│   ├── test_feature3.js            # Feature 3 (graph traceability) tests
│   └── test_sync_metadata_persistence.js  # Sync metadata persistence tests
├── middleware/
│   ├── authMiddleware.js           # JWT authentication middleware
│   ├── roleMiddleware.js           # Role-based access control middleware
│   └── errorHandler.js             # Global error handler
├── database/
│   └── add_graph_sync_log.sql      # MySQL DDL: graph_sync_log table migration
├── neo4j_review_bundle.txt         # Bundled review of all Neo4j-related files
├── .env.example                    # Environment variable template (copy to .env)
├── .gitignore
└── README.md                       # This file
```

---

## Graph Data Model

```
(Donor) -[:DONATES]-> (DonationEvent) -[:GENERATES]-> (BloodUnit)
                          |
                          |-[:RECEIVED_AT]-> (BloodBank)
                          |
                          └-[:HAS_TEST]-> (BloodTest)
```

### Nodes
| Label          | Key Properties                                    |
|:---------------|:--------------------------------------------------|
| `Donor`        | `donor_id`, `name`, `blood_group`, `is_eligible`  |
| `DonationEvent`| `event_id`, `donation_date`, `volume_ml`          |
| `BloodUnit`    | `unit_id`, `unit_code`, `blood_group`, `status`   |
| `BloodTest`    | `test_id`, `test_date`, `result`                  |
| `BloodBank`    | `bank_id`, `name`, `city`                         |

### Relationships
| Type           | Description                              |
|:---------------|:-----------------------------------------|
| `DONATES`      | Donor → DonationEvent                    |
| `GENERATES`    | DonationEvent → BloodUnit                |
| `RECEIVED_AT`  | DonationEvent → BloodBank                |
| `HAS_TEST`     | DonationEvent → BloodTest                |

---

## API Endpoints

| Method | Endpoint                      | Access              | Description                         |
|:-------|:------------------------------|:--------------------|:------------------------------------|
| `POST` | `/api/graph/sync`             | Admin only          | Full projection replacement          |
| `GET`  | `/api/graph/status`           | All authenticated   | Graph health & sync metadata         |
| `GET`  | `/api/graph/trace/unit/:id`   | Admin, Doctor, Nurse| Trace blood unit lineage             |
| `GET`  | `/api/graph/trace/donor/:id`  | Admin, Doctor, Nurse| Trace all donations by a donor       |
| `GET`  | `/api/graph/expand/:type/:id` | Admin, Doctor, Nurse| Expand neighbor nodes (graph explore)|
| `GET`  | `/api/graph/details/:type/:id`| Admin, Doctor, Nurse| Comprehensive entity details         |

---

## Setup

### 1. Install dependencies
```bash
cd DA3_Neo4j
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your actual Neo4j AuraDB and MySQL credentials
```

### 3. Run diagnostics
```bash
npm run diagnose       # Read-only Neo4j connectivity & graph state
npm run verify         # Quick connectivity check
```

### 4. Run tests (requires backend server on port 5000)
```bash
npm run test:integration    # Full integration test suite
npm run test:graph          # API endpoint smoke tests
npm run test:feature3       # Feature 3 traceability tests
npm run test:sync-meta      # Sync metadata persistence tests
```

---

## Notes

- The `graphSyncService.js` reads from MySQL (`config/db.js` in the main backend) and writes to Neo4j — it requires both databases to be running.
- The `graph_sync_log` MySQL table must exist — run `database/add_graph_sync_log.sql` if setting up fresh.
- PII masking is applied at the controller layer: Doctors and Nurses see masked contact info; Admins see full data.
- The Neo4j layer is a **read-optimised projection** of the authoritative MySQL data, rebuilt on demand via the `/sync` endpoint.
