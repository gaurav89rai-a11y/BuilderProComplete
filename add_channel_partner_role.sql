-- 1. Add ChannelPartnerId to Users table if not exists
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'ChannelPartnerId'
)
BEGIN
    ALTER TABLE Users ADD ChannelPartnerId INT NULL;
    ALTER TABLE Users ADD CONSTRAINT FK_Users_ChannelPartners FOREIGN KEY (ChannelPartnerId) REFERENCES ChannelPartners(Id);
END
GO

-- 2. Add 'Channel Partner' to SystemConfigs UserRole category if not exists
IF NOT EXISTS (
    SELECT 1 FROM SystemConfigs 
    WHERE Category = 'UserRole' AND Value = 'Channel Partner'
)
BEGIN
    INSERT INTO SystemConfigs (Category, Value, Label, IsDefault, SortOrder)
    VALUES ('UserRole', 'Channel Partner', 'Channel Partner', 0, 5);
END
GO

-- 3. Add Channel Partner User 1: Sanjay Bhatt (PropNest Realty, Id=1)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'sanjay@propnest.com')
BEGIN
    INSERT INTO Users (Name, Email, Role, Permissions, ChannelPartnerId, CreatedAt)
    VALUES ('Sanjay Bhatt', 'sanjay@propnest.com', 'Channel Partner', 'view_dashboard,manage_leads,manage_customers,manage_bookings,manage_visits', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE Users 
    SET Role = 'Channel Partner', ChannelPartnerId = 1, Permissions = 'view_dashboard,manage_leads,manage_customers,manage_bookings,manage_visits'
    WHERE Email = 'sanjay@propnest.com';
END
GO

-- 4. Add Channel Partner User 2: Rekha Nair (HomeFinder Associates, Id=2)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'rekha@homefinder.com')
BEGIN
    INSERT INTO Users (Name, Email, Role, Permissions, ChannelPartnerId, CreatedAt)
    VALUES ('Rekha Nair', 'rekha@homefinder.com', 'Channel Partner', 'view_dashboard,manage_leads,manage_customers,manage_bookings,manage_visits', 2, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE Users 
    SET Role = 'Channel Partner', ChannelPartnerId = 2, Permissions = 'view_dashboard,manage_leads,manage_customers,manage_bookings,manage_visits'
    WHERE Email = 'rekha@homefinder.com';
END
GO
