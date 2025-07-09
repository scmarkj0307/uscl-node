-- Drop tblTransactionHistory if it exists
IF OBJECT_ID('dbo.tblTransactionHistory', 'U') IS NOT NULL
    DROP TABLE dbo.tblTransactionHistory;

GO

-- Create tblTransactionHistory
CREATE TABLE dbo.tblTransactionHistory (
    historyId INT IDENTITY(1,1) PRIMARY KEY,
    trackingId INT NOT NULL,
    clientId INT NOT NULL,
    trackingMessage NVARCHAR(255) NOT NULL,
    trackingStatusId INT NOT NULL,
    created_at DATETIME NOT NULL,
    changed_at DATETIME DEFAULT GETDATE()
);

GO