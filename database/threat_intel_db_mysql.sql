-- ============================================================
-- Threat Intel & IOC Correlation Platform
-- MySQL Database Setup Script
-- Database: threat_intel_db
-- DBMS: MySQL 8.0+
--
-- This script creates:
--   1. Database
--   2. Roles, users, threat feeds, assets, IOCs, incidents
--   3. IOC/incident and asset/IOC bridge tables
--   4. Alerts
--   5. Primary keys, foreign keys, UNIQUE/CHECK constraints
--   6. Indexes
--   7. Analyst dashboard VIEW
--   8. Risk-score STORED PROCEDURE
--   9. IOC-match TRIGGER
--  10. Demo/seed data
--  11. Important verification queries
--
-- IMPORTANT:
-- This is a clean setup script. Run it against an empty project
-- database. Do NOT run DROP DATABASE on a production database.
-- ============================================================

CREATE DATABASE IF NOT EXISTS threat_intel_db;
USE threat_intel_db;

-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS threat_feeds (
    feed_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    feed_name VARCHAR(100) NOT NULL UNIQUE,
    feed_type VARCHAR(50) NOT NULL,
    source_url TEXT,
    last_fetched TIMESTAMP NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    CONSTRAINT chk_feed_status
        CHECK (status IN ('Active', 'Inactive', 'Error'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assets (
    asset_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_user_id BIGINT NULL,
    asset_name VARCHAR(120) NOT NULL UNIQUE,
    asset_type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    criticality ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assets_owner
        FOREIGN KEY (owner_user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS iocs (
    ioc_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    feed_id BIGINT NULL,
    ioc_value VARCHAR(255) NOT NULL UNIQUE,
    ioc_type ENUM('IP', 'Domain', 'URL', 'Hash') NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    source VARCHAR(100) NOT NULL,
    first_seen TIMESTAMP NULL,
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_iocs_feed
        FOREIGN KEY (feed_id) REFERENCES threat_feeds(feed_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT chk_ioc_time
        CHECK (
            last_seen IS NULL
            OR first_seen IS NULL
            OR last_seen >= first_seen
        )
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incidents (
    incident_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reported_by BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Low',
    status ENUM('Open', 'Investigating', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_incidents_reporter
        FOREIGN KEY (reported_by) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ioc_incident (
    ioc_id BIGINT NOT NULL,
    incident_id BIGINT NOT NULL,
    matched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    match_reason TEXT,
    confidence DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    PRIMARY KEY (ioc_id, incident_id),
    CONSTRAINT fk_ioc_incident_ioc
        FOREIGN KEY (ioc_id) REFERENCES iocs(ioc_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_ioc_incident_incident
        FOREIGN KEY (incident_id) REFERENCES incidents(incident_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_ioc_incident_confidence
        CHECK (confidence BETWEEN 0 AND 100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS asset_ioc (
    asset_id BIGINT NOT NULL,
    ioc_id BIGINT NOT NULL,
    first_seen TIMESTAMP NULL,
    last_seen TIMESTAMP NULL,
    confidence DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    PRIMARY KEY (asset_id, ioc_id),
    CONSTRAINT fk_asset_ioc_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_asset_ioc_ioc
        FOREIGN KEY (ioc_id) REFERENCES iocs(ioc_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_asset_ioc_confidence
        CHECK (confidence BETWEEN 0 AND 100),
    CONSTRAINT chk_asset_ioc_time
        CHECK (
            last_seen IS NULL
            OR first_seen IS NULL
            OR last_seen >= first_seen
        )
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
    alert_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    incident_id BIGINT NOT NULL,
    alert_type VARCHAR(80) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alerts_incident
        FOREIGN KEY (incident_id) REFERENCES incidents(incident_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_users_role_id
    ON users(role_id);

CREATE INDEX idx_incidents_status_severity
    ON incidents(status, severity);

CREATE INDEX idx_iocs_type_severity
    ON iocs(ioc_type, severity);

CREATE INDEX idx_iocs_source
    ON iocs(source);

CREATE INDEX idx_ioc_incident_incident
    ON ioc_incident(incident_id);

CREATE INDEX idx_asset_ioc_asset
    ON asset_ioc(asset_id);

CREATE INDEX idx_alerts_incident_read
    ON alerts(incident_id, is_read);

-- ============================================================
-- 3. ANALYST DASHBOARD VIEW
-- ============================================================

CREATE OR REPLACE VIEW analyst_dashboard_v AS
SELECT
    i.incident_id,
    i.title,
    i.severity,
    i.status,
    i.created_at,
    u.full_name AS reported_by,
    COUNT(DISTINCT ii.ioc_id) AS ioc_count,
    COUNT(DISTINCT ai.asset_id) AS affected_asset_count,
    COUNT(DISTINCT a.alert_id) AS alert_count
FROM incidents i
JOIN users u
    ON u.user_id = i.reported_by
LEFT JOIN ioc_incident ii
    ON ii.incident_id = i.incident_id
LEFT JOIN asset_ioc ai
    ON ai.ioc_id = ii.ioc_id
LEFT JOIN alerts a
    ON a.incident_id = i.incident_id
GROUP BY
    i.incident_id,
    i.title,
    i.severity,
    i.status,
    i.created_at,
    u.full_name;

-- ============================================================
-- 4. STORED PROCEDURE: INCIDENT RISK SCORE
--
-- Score:
--   IOC severity: Critical=30, High=20, Medium=10, Low=5
--   IOC count:    +5 per correlated IOC
--   Asset criticality:
--       Critical=20, High=15, Medium=10, Low=5
--   Maximum score = 100
-- ============================================================

DROP PROCEDURE IF EXISTS calculate_incident_risk;

DELIMITER $$

CREATE PROCEDURE calculate_incident_risk(IN p_incident_id BIGINT)
BEGIN
    SELECT
        i.incident_id,
        COUNT(DISTINCT ii.ioc_id) AS ioc_count,
        COALESCE(
            SUM(
                CASE ioc.severity
                    WHEN 'Critical' THEN 30
                    WHEN 'High' THEN 20
                    WHEN 'Medium' THEN 10
                    ELSE 5
                END
            ),
            0
        ) AS ioc_score,
        COALESCE(
            MAX(
                CASE asset.criticality
                    WHEN 'Critical' THEN 20
                    WHEN 'High' THEN 15
                    WHEN 'Medium' THEN 10
                    ELSE 5
                END
            ),
            0
        ) AS asset_score,
        LEAST(
            100,
            COALESCE(
                SUM(
                    CASE ioc.severity
                        WHEN 'Critical' THEN 30
                        WHEN 'High' THEN 20
                        WHEN 'Medium' THEN 10
                        ELSE 5
                    END
                ),
                0
            )
            + COUNT(DISTINCT ii.ioc_id) * 5
            + COALESCE(
                MAX(
                    CASE asset.criticality
                        WHEN 'Critical' THEN 20
                        WHEN 'High' THEN 15
                        WHEN 'Medium' THEN 10
                        ELSE 5
                    END
                ),
                0
            )
        ) AS risk_score
    FROM incidents i
    LEFT JOIN ioc_incident ii
        ON ii.incident_id = i.incident_id
    LEFT JOIN iocs ioc
        ON ioc.ioc_id = ii.ioc_id
    LEFT JOIN asset_ioc ai
        ON ai.ioc_id = ii.ioc_id
    LEFT JOIN assets asset
        ON asset.asset_id = ai.asset_id
    WHERE i.incident_id = p_incident_id
    GROUP BY i.incident_id;
END$$

DELIMITER ;

-- ============================================================
-- 5. TRIGGER: IOC MATCH -> AUTOMATIC ALERT
--
-- When an IOC is linked to an Open/Investigating incident,
-- an IOC Match alert is automatically created.
-- ============================================================

DROP TRIGGER IF EXISTS trg_ioc_match_alert;

DELIMITER $$

CREATE TRIGGER trg_ioc_match_alert
AFTER INSERT ON ioc_incident
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM incidents
        WHERE incident_id = NEW.incident_id
          AND status IN ('Open', 'Investigating')
    ) THEN
        INSERT INTO alerts (
            incident_id,
            alert_type,
            message,
            severity
        )
        SELECT
            NEW.incident_id,
            'IOC Match',
            'New IOC matched an active incident.',
            severity
        FROM incidents
        WHERE incident_id = NEW.incident_id;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- 6. DEMO / SEED DATA
-- ============================================================

INSERT INTO roles (role_name, description)
VALUES
    ('Admin', 'Manages users, feeds and threat data'),
    ('Analyst', 'Investigates IOCs and security incidents')
ON DUPLICATE KEY UPDATE
    description = VALUES(description);

-- Replace these demo hashes with real application-generated
-- password hashes if authentication is implemented.
INSERT INTO users (
    role_id,
    full_name,
    email,
    password_hash,
    status
)
SELECT
    role_id,
    'Demo Analyst',
    'analyst@example.com',
    '$2b$12$REPLACE_WITH_A_REAL_HASH',
    'Active'
FROM roles
WHERE role_name = 'Analyst'
  AND NOT EXISTS (
      SELECT 1 FROM users
      WHERE email = 'analyst@example.com'
  );

INSERT INTO users (
    role_id,
    full_name,
    email,
    password_hash,
    status
)
SELECT
    role_id,
    'Demo Admin',
    'admin@example.com',
    '$2b$12$REPLACE_WITH_A_REAL_HASH',
    'Active'
FROM roles
WHERE role_name = 'Admin'
  AND NOT EXISTS (
      SELECT 1 FROM users
      WHERE email = 'admin@example.com'
  );

INSERT INTO threat_feeds (
    feed_name,
    feed_type,
    source_url,
    status
)
VALUES (
    'Demo Threat Feed',
    'IOC',
    'https://example.com/feed',
    'Active'
)
ON DUPLICATE KEY UPDATE
    feed_type = VALUES(feed_type),
    source_url = VALUES(source_url),
    status = VALUES(status);

INSERT INTO assets (
    owner_user_id,
    asset_name,
    asset_type,
    ip_address,
    criticality
)
SELECT
    user_id,
    'Demo Web Server',
    'Server',
    '192.0.2.10',
    'High'
FROM users
WHERE email = 'analyst@example.com'
  AND NOT EXISTS (
      SELECT 1 FROM assets
      WHERE asset_name = 'Demo Web Server'
  );

INSERT INTO iocs (
    feed_id,
    ioc_value,
    ioc_type,
    severity,
    source
)
SELECT
    feed_id,
    '203.0.113.50',
    'IP',
    'High',
    'Demo Threat Feed'
FROM threat_feeds
WHERE feed_name = 'Demo Threat Feed'
  AND NOT EXISTS (
      SELECT 1 FROM iocs
      WHERE ioc_value = '203.0.113.50'
  );

INSERT INTO incidents (
    reported_by,
    title,
    description,
    severity,
    status
)
SELECT
    user_id,
    'IOC Trigger Test',
    'Demo incident used to test IOC correlation and automatic alert generation.',
    'High',
    'Open'
FROM users
WHERE email = 'analyst@example.com'
  AND NOT EXISTS (
      SELECT 1 FROM incidents
      WHERE title = 'IOC Trigger Test'
  );

-- Link the demo IOC to the demo incident.
-- The trigger will automatically create the IOC Match alert.
INSERT INTO ioc_incident (
    ioc_id,
    incident_id,
    match_reason,
    confidence
)
SELECT
    i.ioc_id,
    inc.incident_id,
    'IOC observed in incident source data',
    95.00
FROM iocs i
JOIN incidents inc
    ON inc.title = 'IOC Trigger Test'
WHERE i.ioc_value = '203.0.113.50'
  AND NOT EXISTS (
      SELECT 1
      FROM ioc_incident x
      WHERE x.ioc_id = i.ioc_id
        AND x.incident_id = inc.incident_id
  );

-- Link the IOC to the affected demo asset.
INSERT INTO asset_ioc (
    asset_id,
    ioc_id,
    confidence
)
SELECT
    a.asset_id,
    i.ioc_id,
    95.00
FROM assets a
JOIN iocs i
    ON i.ioc_value = '203.0.113.50'
WHERE a.asset_name = 'Demo Web Server'
  AND NOT EXISTS (
      SELECT 1
      FROM asset_ioc x
      WHERE x.asset_id = a.asset_id
        AND x.ioc_id = i.ioc_id
  );

-- ============================================================
-- 7. IMPORTANT DEMONSTRATION QUERIES
-- ============================================================

-- Check database
SELECT DATABASE() AS current_database;

-- Show all tables
SHOW TABLES;

-- Table structures
DESCRIBE roles;
DESCRIBE users;
DESCRIBE threat_feeds;
DESCRIBE assets;
DESCRIBE iocs;
DESCRIBE incidents;
DESCRIBE ioc_incident;
DESCRIBE asset_ioc;
DESCRIBE alerts;

-- High / Critical IOCs
SELECT
    ioc_id,
    ioc_value,
    ioc_type,
    severity,
    source
FROM iocs
WHERE severity IN ('High', 'Critical')
ORDER BY created_at DESC;

-- Incidents with number of IOCs
SELECT
    inc.incident_id,
    inc.title,
    COUNT(ii.ioc_id) AS ioc_count
FROM incidents inc
LEFT JOIN ioc_incident ii
    ON ii.incident_id = inc.incident_id
GROUP BY inc.incident_id, inc.title
HAVING COUNT(ii.ioc_id) >= 1
ORDER BY ioc_count DESC;

-- Incidents with reporter and related IOCs
SELECT
    inc.incident_id,
    inc.title,
    u.full_name AS reporter,
    i.ioc_value,
    i.ioc_type,
    i.severity
FROM incidents inc
JOIN users u
    ON u.user_id = inc.reported_by
JOIN ioc_incident ii
    ON ii.incident_id = inc.incident_id
JOIN iocs i
    ON i.ioc_id = ii.ioc_id
ORDER BY inc.incident_id;

-- Open high-risk incidents
SELECT *
FROM analyst_dashboard_v
WHERE status IN ('Open', 'Investigating')
  AND severity IN ('High', 'Critical')
ORDER BY created_at DESC;

-- Search exact IOC
SELECT *
FROM iocs
WHERE ioc_value = '203.0.113.50';

-- Analyst dashboard
SELECT *
FROM analyst_dashboard_v
ORDER BY created_at DESC;

-- Risk score
CALL calculate_incident_risk(
    (SELECT incident_id
     FROM incidents
     WHERE title = 'IOC Trigger Test'
     LIMIT 1)
);

-- Alerts generated by the trigger
SELECT *
FROM alerts
ORDER BY created_at DESC;

-- Index verification
SHOW INDEX FROM incidents;
SHOW INDEX FROM iocs;

-- ============================================================
-- 8. UPDATE / DELETE / TRANSACTION DEMONSTRATIONS
-- ============================================================

-- UPDATE demonstration
-- UPDATE iocs
-- SET source = 'Updated Threat Feed'
-- WHERE ioc_id = 1;
--
-- SELECT ioc_id, source
-- FROM iocs
-- WHERE ioc_id = 1;

-- DELETE demonstration
-- INSERT INTO alerts (incident_id, alert_type, message, severity)
-- VALUES (
--     1,
--     'Test Delete',
--     'Temporary alert for DELETE demonstration',
--     'Low'
-- );
--
-- DELETE FROM alerts
-- WHERE alert_type = 'Test Delete';
--
-- SELECT *
-- FROM alerts
-- WHERE alert_type = 'Test Delete';

-- ALTER TABLE demonstration
-- CREATE TABLE alter_demo (
--     id INT PRIMARY KEY
-- );
--
-- ALTER TABLE alter_demo
-- ADD COLUMN demo_note VARCHAR(100);
--
-- DESCRIBE alter_demo;
--
-- DROP TABLE alter_demo;

-- Transaction / rollback demonstration
-- START TRANSACTION;
--
-- INSERT INTO alerts (
--     incident_id,
--     alert_type,
--     message,
--     severity
-- )
-- VALUES (
--     1,
--     'Transaction Test',
--     'Transaction test alert',
--     'Low'
-- );
--
-- ROLLBACK;
--
-- SELECT *
-- FROM alerts
-- WHERE message = 'Transaction test alert';

-- ============================================================
-- END OF MYSQL SCRIPT
-- ============================================================
