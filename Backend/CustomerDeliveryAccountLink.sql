-- Run after creating cust.CustomerAccount and cust.CustomerDeliveryDetails.
IF COL_LENGTH('cust.CustomerDeliveryDetails', 'CustomerAccountId') IS NULL
    ALTER TABLE cust.CustomerDeliveryDetails ADD CustomerAccountId INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('cust.CustomerDeliveryDetails')
               AND name = 'FK_CustDelivery_CustomerAccount')
    ALTER TABLE cust.CustomerDeliveryDetails ADD CONSTRAINT FK_CustDelivery_CustomerAccount
        FOREIGN KEY (CustomerAccountId) REFERENCES cust.CustomerAccount (CustomerAccountId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('cust.CustomerDeliveryDetails')
               AND name = 'IX_CustomerDeliveryDetails_Account')
    CREATE INDEX IX_CustomerDeliveryDetails_Account
        ON cust.CustomerDeliveryDetails (CustomerAccountId, CustomerDeliveryId DESC);
GO
