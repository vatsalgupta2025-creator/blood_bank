-- ============================================================
--  Additive migration: graph_sync_log
--  Purpose : Persist Neo4j graph-projection sync metadata so
--            that GET /api/graph/status survives backend restarts.
--  Safety  : CREATE TABLE IF NOT EXISTS is idempotent.
--            No existing table is altered, truncated, or dropped.
--            No business data is touched.
--  Apply   : Run once against blood_bank_db before or after
--            deploying the updated backend.
-- ============================================================

CREATE TABLE IF NOT EXISTS graph_sync_log (
  id                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,

  -- When the sync completed (UTC).
  synced_at            DATETIME        NOT NULL,

  -- 'success' or 'failure'. Only successful syncs write 'success'.
  sync_status          VARCHAR(16)     NOT NULL DEFAULT 'success',

  -- Managed-node counts captured immediately after sync.
  nodes_total          INT UNSIGNED    NOT NULL DEFAULT 0,
  nodes_donor          INT UNSIGNED    NOT NULL DEFAULT 0,
  nodes_donation_event INT UNSIGNED    NOT NULL DEFAULT 0,
  nodes_blood_unit     INT UNSIGNED    NOT NULL DEFAULT 0,
  nodes_blood_test     INT UNSIGNED    NOT NULL DEFAULT 0,
  nodes_blood_bank     INT UNSIGNED    NOT NULL DEFAULT 0,

  -- Managed-relationship counts.
  rels_total           INT UNSIGNED    NOT NULL DEFAULT 0,
  rels_donates         INT UNSIGNED    NOT NULL DEFAULT 0,
  rels_received_at     INT UNSIGNED    NOT NULL DEFAULT 0,
  rels_generates       INT UNSIGNED    NOT NULL DEFAULT 0,
  rels_has_test        INT UNSIGNED    NOT NULL DEFAULT 0,

  -- Optional one-line error summary (no stack traces, credentials, or PII).
  error_summary        VARCHAR(500)    NULL,

  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Persists Neo4j graph-projection sync metadata for status reporting across restarts.';
