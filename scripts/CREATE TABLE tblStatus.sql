-- Check if the table exists, then drop it
IF OBJECT_ID('dbo.tblStatus', 'U') IS NOT NULL
    DROP TABLE dbo.tblStatus;

GO

-- Create tblStatus
CREATE TABLE dbo.tblStatus (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    statusName VARCHAR(255) NOT NULL,
);

GO

-- Insert predefined statuses
SET IDENTITY_INSERT dbo.tblStatus ON;

INSERT INTO dbo.tblStatus (Id, statusName)
VALUES 
    (1, 'Pending'),
    (2, 'Ongoing'),
    (3, 'Finished');

SET IDENTITY_INSERT dbo.tblStatus OFF;

GO
