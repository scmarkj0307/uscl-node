-- Drop tblTransactionHistory if it exists 
IF OBJECT_ID('dbo.tblTransactionHistory', 'U') IS NOT NULL
    DROP TABLE dbo.tblTransactionHistory;

GO

-- Create tblTransactionHistory with trackingId as NVARCHAR and description column
CREATE TABLE dbo.tblTransactionHistory (
    historyId INT IDENTITY(1,1) PRIMARY KEY,
    trackingId NVARCHAR(50) NOT NULL,
    clientId INT NOT NULL,
    trackingMessage NVARCHAR(255) NOT NULL,
    trackingStatusId INT NOT NULL,
    description NVARCHAR(255) NULL, -- 👈 added column
    created_at DATETIME NOT NULL,
    changed_at DATETIME DEFAULT GETDATE()
);

GO
