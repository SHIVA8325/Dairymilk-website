-- ==========================================
-- Fevicol Choco Ltd - Supabase Database Schema
-- Project ID: ffzxalvmywrlptlurnlq
-- ==========================================

-- 1. Product Interactions / Views Table
CREATE TABLE IF NOT EXISTS public.product_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price NUMERIC(10, 2),
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alias Table: product_views (for compatibility)
CREATE TABLE IF NOT EXISTS public.product_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price NUMERIC(10, 2),
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Cart Events / Added Items Table
CREATE TABLE IF NOT EXISTS public.cart_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    weight VARCHAR(50),
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alias Table: cart_items (for compatibility)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    weight VARCHAR(50),
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    shipping_address TEXT,
    subtotal NUMERIC(10, 2),
    shipping_fee NUMERIC(10, 2),
    total NUMERIC(10, 2),
    items JSONB,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Wishlist Events Table
CREATE TABLE IF NOT EXISTS public.wishlist_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'add' or 'remove'
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) & Allow Anonymous Inserts
ALTER TABLE public.product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create Policies for Anonymous Inserts
CREATE POLICY "Allow public insert on product_interactions" ON public.product_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on product_views" ON public.product_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on cart_events" ON public.cart_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on cart_items" ON public.cart_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on wishlist_events" ON public.wishlist_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on newsletter_subscribers" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);

-- Create Read Policies for Authenticated / Public
CREATE POLICY "Allow public select on product_interactions" ON public.product_interactions FOR SELECT USING (true);
CREATE POLICY "Allow public select on product_views" ON public.product_views FOR SELECT USING (true);
CREATE POLICY "Allow public select on cart_events" ON public.cart_events FOR SELECT USING (true);
CREATE POLICY "Allow public select on cart_items" ON public.cart_items FOR SELECT USING (true);
CREATE POLICY "Allow public select on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public select on wishlist_events" ON public.wishlist_events FOR SELECT USING (true);
CREATE POLICY "Allow public select on newsletter_subscribers" ON public.newsletter_subscribers FOR SELECT USING (true);
