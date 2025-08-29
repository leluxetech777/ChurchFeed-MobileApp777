-- Migration: Add Stripe-related fields to existing churches table
-- Run this if you already have a churches table without Stripe fields

-- Add Stripe customer ID column
ALTER TABLE churches ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Add subscription status column
ALTER TABLE churches ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending' 
CHECK (subscription_status IN ('pending', 'active', 'past_due', 'canceled', 'trialing'));

-- Add updated_at column
ALTER TABLE churches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_churches_updated_at 
    BEFORE UPDATE ON churches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_churches_stripe_customer ON churches(stripe_customer_id);

-- Update existing churches to have 'pending' status if null
UPDATE churches SET subscription_status = 'pending' WHERE subscription_status IS NULL;