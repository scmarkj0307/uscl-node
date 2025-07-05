-- Drop the trigger if it exists
IF OBJECT_ID('dbo.trg_AuditTransactionUpdate', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_AuditTransactionUpdate;

-- Create the trigger to track updates
CREATE TRIGGER trg_AuditTransactionUpdate
ON dbo.tblTransactions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.tblTransactionHistory (
        trackingId,
        trackingMessage,
        trackingStatusId,
        created_at,
        changed_at
    )
    SELECT 
        d.trackingId,
        d.trackingMessage,
        d.trackingStatusId,
        d.created_at,
        GETDATE()
    FROM DELETED d;
END;