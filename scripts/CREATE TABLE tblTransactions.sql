-- Check if the table exists, then drop it
IF OBJECT_ID('dbo.tblTransactions', 'U') IS NOT NULL
    DROP TABLE dbo.tblTransactions;

GO


-- Create tblTransactions
CREATE TABLE dbo.tblTransactions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    trackingId NVARCHAR(50) NOT NULL UNIQUE, -- 👈 changed from INT to NVARCHAR
    clientId INT NOT NULL,
    trackingMessage NVARCHAR(255) NOT NULL,
    trackingStatusId INT NOT NULL,
    description NVARCHAR(255) NULL, -- 👈 new column
    created_at DATETIME DEFAULT GETDATE()
);

GO
