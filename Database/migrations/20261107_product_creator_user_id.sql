-- Preserve the existing numeric CreatedBy and historical values.
-- The demo login identifier is self-reported and is not an authenticated audit identity.
IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
    THROW 50000, 'dbo.Products does not exist.', 1;

IF COL_LENGTH(N'dbo.Products', N'CreatedBy') IS NULL
    ALTER TABLE dbo.Products ADD CreatedBy int NULL;

IF COL_LENGTH(N'dbo.Products', N'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE dbo.Products ADD UpdatedAt datetime2 NULL;
    EXEC(N'UPDATE dbo.Products SET UpdatedAt = CreatedAt WHERE UpdatedAt IS NULL');
    ALTER TABLE dbo.Products ALTER COLUMN UpdatedAt datetime2 NOT NULL;
END;

IF COL_LENGTH(N'dbo.Products', N'CreatedByUserId') IS NULL
    ALTER TABLE dbo.Products ADD CreatedByUserId nvarchar(100) NULL;
