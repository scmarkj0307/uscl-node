-- Check if the table exists, then drop it
IF OBJECT_ID('dbo.tblClients', 'U') IS NOT NULL
    DROP TABLE dbo.tblClients;

-- Create tblClients
CREATE TABLE dbo.tblClients (
    clientId INT IDENTITY(1,1) PRIMARY KEY,
    clientName NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
