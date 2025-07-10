-- Drop the trigger if it exists
IF OBJECT_ID('dbo.trg_AuditTransactionUpdate', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_AuditTransactionUpdate;

GO

-- Create the trigger to track INSERTs and UPDATEs
CREATE TRIGGER trg_AuditTransactionUpdate
ON dbo.tblTransactions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Track changes from INSERTED rows
    INSERT INTO dbo.tblTransactionHistory (
        trackingId,
        clientId,
        trackingMessage,
        trackingStatusId,
        created_at,
        changed_at
    )
    SELECT 
        i.trackingId,
        i.clientId,
        i.trackingMessage,
        i.trackingStatusId,
        i.created_at,
        GETDATE()
    FROM INSERTED i;
END;

GO
