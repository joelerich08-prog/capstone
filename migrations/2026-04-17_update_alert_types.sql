-- Migration: Update alerts table to support new inventory tier alert types
-- Date: 2026-04-17
-- Description: Add low_retail, low_shelf, and low_wholesale alert types to the alerts table ENUM

ALTER TABLE alerts
    MODIFY COLUMN type ENUM('low_stock', 'out_of_stock', 'low_retail', 'low_shelf', 'low_wholesale', 'expiring', 'expired', 'system') NOT NULL;