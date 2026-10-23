# MySQL_Database — LifeFlow Blood Bank SQL Files

This folder contains all MySQL schema definitions, migration scripts, and data backups for the **LifeFlow Blood Bank Management System**.

> The live backend (`backend/`) connects to **Aiven MySQL** using these schemas.  
> The full React frontend lives in `frontend/`.

---

## Files

| File | Purpose |
|:-----|:--------|
| `aiven_ready_backup.sql` | ✅ **Primary** — production-ready schema + data dump for Aiven MySQL (cloud) |
| `blood_bank_local_backup.sql` | Full local MySQL backup (dev/local setup) |
| `migration.sql` | Incremental migration script (schema changes & seeds) |
| `BloodBankDB_Oracle.sql` | Oracle-compatible version of the schema |
| `add_graph_sync_log.sql` | DDL for `graph_sync_log` table used by the Neo4j sync layer |

---

## Database Schema (Tables)

| Table | Description |
|:------|:------------|
| `BloodBank` | Blood bank branches |
| `Staff` | Hospital/bank staff with roles (Admin, Doctor, Nurse, Technician) |
| `Donor` | Donor records with eligibility tracking |
| `DonationEvent` | Each donation session |
| `BloodUnit` | Individual blood units with status & expiry |
| `BloodTest` | Lab test results per donation |
| `BloodRequest` | Hospital blood requests with urgency levels |
| `Receiver` | Patient/receiver records |
| `graph_sync_log` | Tracks MySQL → Neo4j sync metadata |

---

## How to Use

### Aiven MySQL (Cloud)
```bash
mysql -h <aiven-host> -P <port> -u avnadmin -p --ssl-ca=backend/ca.pem defaultdb < aiven_ready_backup.sql
```

### Local MySQL
```bash
mysql -u root -p blood_bank_db < blood_bank_local_backup.sql
```

---

## Relationship to Other Folders

| Folder | Relation |
|:-------|:---------|
| `backend/` | Node.js + Express API — reads/writes this MySQL database |
| `frontend/` | React app — displays data from the API |
| `DA3_Neo4j/` | Neo4j graph layer — syncs FROM this MySQL data |
