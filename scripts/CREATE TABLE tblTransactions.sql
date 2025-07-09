-- Check if the table exists, then drop it
IF OBJECT_ID('dbo.tblTransactions', 'U') IS NOT NULL
    DROP TABLE dbo.tblTransactions;

GO


-- Create tblTransactions
CREATE TABLE dbo.tblTransactions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    trackingId INT NOT NULL UNIQUE,
    clientId INT NOT NULL,
    trackingMessage NVARCHAR(255) NOT NULL,
	trackingStatusId INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
);

GO