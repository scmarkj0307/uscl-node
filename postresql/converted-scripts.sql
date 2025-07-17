-- Drop tables if they exist (order matters due to foreign keys)
DROP TABLE IF EXISTS tblTransactionHistory;
DROP TABLE IF EXISTS tblTransactions;
DROP TABLE IF EXISTS tblStatus;
DROP TABLE IF EXISTS tblClients;
DROP TABLE IF EXISTS tblAdmins;

-- Create tblAdmins
CREATE TABLE tblAdmins (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    isAdmin BOOLEAN DEFAULT FALSE,
    isSuperAdmin BOOLEAN DEFAULT FALSE,
    isDemo BOOLEAN DEFAULT FALSE
);

-- Create tblClients
CREATE TABLE tblClients (
    clientId SERIAL PRIMARY KEY,
    clientName VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create tblStatus
CREATE TABLE tblStatus (
    id SERIAL PRIMARY KEY,
    statusName VARCHAR(255) NOT NULL
);

-- Insert predefined statuses
INSERT INTO tblStatus (id, statusName)
VALUES 
    (1, 'Pending'),
    (2, 'Ongoing'),
    (3, 'Finished');

-- Create tblTransactions
CREATE TABLE tblTransactions (
    id SERIAL PRIMARY KEY,
    trackingId VARCHAR(50) NOT NULL UNIQUE,
    clientId INT NOT NULL REFERENCES tblClients(clientId),
    trackingMessage VARCHAR(255) NOT NULL,
    trackingStatusId INT NOT NULL REFERENCES tblStatus(id),
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create tblTransactionHistory
CREATE TABLE tblTransactionHistory (
    historyId SERIAL PRIMARY KEY,
    trackingId VARCHAR(50) NOT NULL,
    clientId INT NOT NULL,
    trackingMessage VARCHAR(255) NOT NULL,
    trackingStatusId INT NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Trigger function to insert into tblTransactionHistory on insert/update
CREATE OR REPLACE FUNCTION audit_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tblTransactionHistory (
        trackingId,
        clientId,
        trackingMessage,
        trackingStatusId,
        description,
        created_at,
        changed_at
    )
    SELECT 
        NEW.trackingId,
        NEW.clientId,
        NEW.trackingMessage,
        NEW.trackingStatusId,
        NEW.description,
        NEW.created_at,
        NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trg_audit_transaction_update
AFTER INSERT OR UPDATE ON tblTransactions
FOR EACH ROW EXECUTE FUNCTION audit_transaction_changes();
