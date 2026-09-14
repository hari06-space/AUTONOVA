CREATE TABLE ITEM_TRANSACTION_TYPE (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TYPE NVARCHAR(50) NOT NULL UNIQUE,
    DESCRIPTION NVARCHAR(50),
    STOCK_EFFECT BIT, -- 0 for IN, 1 for OUT
    CREATED_BY NVARCHAR(50) NOT NULL,
    CREATED_DATE DATETIME DEFAULT GETDATE(),
    UPDATED_BY NVARCHAR(50),
    UPDATED_DATE DATETIME
);
GO

INSERT INTO ITEM_TRANSACTION_TYPE (TYPE, STOCK_EFFECT, DESCRIPTION, CREATED_BY, CREATED_DATE) VALUES 
('OPENING_STOCK', 0, 'Initial stock', 'SYSTEM', GETDATE()),
('PURCHASE_RECEIPT', 0, 'Vendor received stock', 'SYSTEM', GETDATE()),
('PURCHASE_RETURN', 1, 'Return material to vendor', 'SYSTEM', GETDATE()),
('SALES_ISSUE', 1, 'Sold stock', 'SYSTEM', GETDATE()),
('SALES_RETURN', 0, 'Customer returned stock', 'SYSTEM', GETDATE()),
('MATERIAL_ISSUE', 1, 'Issue to production', 'SYSTEM', GETDATE()),
('PRODUCTION_RECEIPT', 0, 'Finished goods received', 'SYSTEM', GETDATE()),
('STOCK_RETURN', 0, 'Return from production/department', 'SYSTEM', GETDATE()),
('STOCK_ADJUSTMENT_IN', 0, 'Increase correction', 'SYSTEM', GETDATE()),
('STOCK_ADJUSTMENT_OUT', 1, 'Decrease correction', 'SYSTEM', GETDATE()),
('TRANSFER_OUT', 1, 'Move from location', 'SYSTEM', GETDATE()),
('TRANSFER_IN', 0, 'Receive transfer', 'SYSTEM', GETDATE()),
('REJECTION_IN', 0, 'Move to rejection stock', 'SYSTEM', GETDATE()),
('REJECTION_OUT', 1, 'Dispose/rework rejection', 'SYSTEM', GETDATE());
GO
