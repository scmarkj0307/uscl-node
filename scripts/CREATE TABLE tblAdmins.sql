-- Check if the table exists, then drop it
IF OBJECT_ID('dbo.tblAdmins', 'U') IS NOT NULL
    DROP TABLE dbo.tblAdmins;

GO

-- Create the table
CREATE TABLE dbo.tblAdmins (
    admin_id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    email NVARCHAR(100),
    created_at DATETIME DEFAULT GETDATE()
);

GO