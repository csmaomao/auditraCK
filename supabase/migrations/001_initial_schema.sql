-- =============================================================================
-- AudiTRACK — Initial Database Schema
-- =============================================================================
-- Run this SQL in your Supabase project:
--   Supabase Dashboard > SQL Editor > New Query > paste and run
--
-- Tables created:
--   profiles, requests, import_batches, assets, request_assets,
--   documents, activity_logs
--
-- RLS policies: all tables are accessible only to authenticated users
-- with role = 'auditor' or 'admin' (stored in profiles.role).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. PROFILES
-- Extends Supabase auth.users with role and display name.
-- A profile row is created automatically when a user signs up (see trigger below).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'auditor'
                CHECK (role IN ('auditor', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ---------------------------------------------------------------------------
-- 2. REQUESTS
-- Logged borrower's forms submitted by RSOs.
-- The Auditor creates and manages these records.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name   TEXT NOT NULL,
  event_name          TEXT NOT NULL,
  purpose             TEXT,
  date_submitted      DATE,
  event_date          DATE NOT NULL,
  start_time          TIME,
  end_time            TIME,
  venue               TEXT NOT NULL,
  contact_person      TEXT,
  contact_number      TEXT,
  secretary_signed    BOOLEAN NOT NULL DEFAULT FALSE,
  auditor_signed      BOOLEAN NOT NULL DEFAULT FALSE,
  president_approved  BOOLEAN NOT NULL DEFAULT FALSE,
  status              TEXT NOT NULL DEFAULT 'Pending'
                        CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')),
  remarks             TEXT,
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 3. IMPORT_BATCHES
-- Records each Excel inventory import event.
-- Must be created before assets (assets.import_batch_id references this).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS import_batches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name    TEXT NOT NULL,
  imported_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  imported_at  TIMESTAMPTZ DEFAULT NOW(),
  row_count    INTEGER,
  notes        TEXT
);


-- ---------------------------------------------------------------------------
-- 4. ASSETS
-- The official AUSG asset inventory.
-- This table is REPLACED (not updated) when the Auditor uploads a new Excel file.
-- tag_number is TEXT because values may contain letters, leading zeros, etc.
-- quantity_text preserves the original Excel value (e.g. "12*").
-- quantity_numeric is the parsed integer (null if not parseable).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_number              TEXT,
  item_description        TEXT,
  date_acquired           TEXT,
  quantity_text           TEXT,
  quantity_numeric        INTEGER,
  actual_count            INTEGER,
  unit_cost               NUMERIC(12, 2),
  total_cost              NUMERIC(12, 2),
  life_span               TEXT,
  code                    TEXT,
  tag_location_issued_to  TEXT,
  remarks                 TEXT,
  import_batch_id         UUID REFERENCES import_batches(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 5. REQUEST_ASSETS
-- Links assets to requests, with snapshot fields for historical integrity.
--
-- IMPORTANT DESIGN DECISION:
--   asset_id is NULLABLE with ON DELETE SET NULL (not CASCADE).
--   When the assets table is replaced by an Excel import, asset_id becomes NULL
--   but the snapshot fields (asset_tag_number, asset_description) are preserved.
--   This means old request history always shows the correct asset info.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_assets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id          UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  asset_id            UUID REFERENCES assets(id) ON DELETE SET NULL,
  -- Snapshot fields: copied from the asset at the time of selection.
  -- These are NEVER modified after creation, even if the asset is later replaced.
  asset_tag_number    TEXT,
  asset_description   TEXT,
  quantity_requested  INTEGER NOT NULL DEFAULT 1,
  quantity_returned   INTEGER DEFAULT 0,
  remarks             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 6. DOCUMENTS
-- File attachments linked to requests (scanned forms, photos of paperwork).
-- There is NO standalone Documents page — attachments are managed inside
-- the Requests page only.
-- Storage path: documents/{request_id}/{timestamp}-{filename}
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID REFERENCES requests(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  document_type TEXT,
  file_url      TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  uploaded_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 7. ACTIVITY_LOGS
-- Internal audit log. NOT exposed as a user-facing page.
-- Records significant actions for background tracking.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    UUID,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- All tables are locked down to authenticated users with role auditor or admin.
-- =============================================================================

-- Helper function: returns true if the current user has role auditor or admin
CREATE OR REPLACE FUNCTION is_auditor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('auditor', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update their own row; auditors/admins can read all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_auditor_or_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- requests: auditors/admins have full access
CREATE POLICY "Auditors can manage requests"
  ON requests FOR ALL
  USING (is_auditor_or_admin());

-- assets: auditors/admins have full access
CREATE POLICY "Auditors can manage assets"
  ON assets FOR ALL
  USING (is_auditor_or_admin());

-- request_assets: auditors/admins have full access
CREATE POLICY "Auditors can manage request_assets"
  ON request_assets FOR ALL
  USING (is_auditor_or_admin());

-- documents: auditors/admins have full access
CREATE POLICY "Auditors can manage documents"
  ON documents FOR ALL
  USING (is_auditor_or_admin());

-- activity_logs: auditors/admins can insert and read
CREATE POLICY "Auditors can manage activity_logs"
  ON activity_logs FOR ALL
  USING (is_auditor_or_admin());

-- import_batches: auditors/admins have full access
CREATE POLICY "Auditors can manage import_batches"
  ON import_batches FOR ALL
  USING (is_auditor_or_admin());


-- =============================================================================
-- INDEXES
-- Speed up common queries.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_requests_status       ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_event_date   ON requests(event_date);
CREATE INDEX IF NOT EXISTS idx_requests_created_at   ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_assets_request ON request_assets(request_id);
CREATE INDEX IF NOT EXISTS idx_request_assets_asset   ON request_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_documents_request      ON documents(request_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created  ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_tag_number      ON assets(tag_number);
