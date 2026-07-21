-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL, -- positive for credits/deposits, negative for payments/withdrawals
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'ride_payment', 'ride_earnings', 'refund')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to update wallets updated_at automatically
CREATE OR REPLACE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create a wallet when a new profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wallets (id, balance)
  VALUES (new.id, 0.00);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on public.profiles insert
CREATE OR REPLACE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_wallet();

-- Function to adjust wallet balance when a transaction is recorded
CREATE OR REPLACE FUNCTION public.update_wallet_balance_from_transaction()
RETURNS trigger AS $$
BEGIN
  UPDATE public.wallets
  SET balance = balance + new.amount
  WHERE id = new.wallet_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on wallet_transactions insert
CREATE OR REPLACE TRIGGER on_wallet_transaction_inserted
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance_from_transaction();
