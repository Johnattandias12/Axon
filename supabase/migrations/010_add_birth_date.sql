-- Migration 010 - Add birth_date to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
