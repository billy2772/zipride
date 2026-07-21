-- Enable RLS for all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_tracking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow users to update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Driver Profiles Policies
CREATE POLICY "Allow public read access to driver profiles" ON public.driver_profiles
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow drivers to update own profile" ON public.driver_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 3. Vehicles Policies
CREATE POLICY "Allow public read access to active vehicles" ON public.vehicles
  FOR SELECT TO authenticated USING (is_active = TRUE OR driver_id = auth.uid());

CREATE POLICY "Allow drivers to modify own vehicles" ON public.vehicles
  FOR ALL TO authenticated USING (driver_id = auth.uid());

-- 4. Driver Locations Policies
CREATE POLICY "Allow public read access to driver coordinates" ON public.driver_locations
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow drivers to update own coordinates" ON public.driver_locations
  FOR ALL TO authenticated USING (driver_id = auth.uid());

-- 5. Rides Policies
CREATE POLICY "Allow riders/drivers/admins to view relevant rides" ON public.rides
  FOR SELECT TO authenticated USING (
    rider_id = auth.uid() 
    OR driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

CREATE POLICY "Allow riders to create new rides" ON public.rides
  FOR INSERT TO authenticated WITH CHECK (rider_id = auth.uid());

CREATE POLICY "Allow riders/drivers to update relevant rides" ON public.rides
  FOR UPDATE TO authenticated USING (
    rider_id = auth.uid() 
    OR driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- 6. Ride Tracking Logs Policies
CREATE POLICY "Allow participants to view ride path history" ON public.ride_tracking_logs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.rides r 
      WHERE r.id = ride_id AND (r.rider_id = auth.uid() OR r.driver_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

CREATE POLICY "Allow assigned driver to record trip coordinates log" ON public.ride_tracking_logs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rides r 
      WHERE r.id = ride_id AND r.driver_id = auth.uid()
    )
  );

-- 7. Payments Policies
CREATE POLICY "Allow participants to view relevant payments" ON public.payments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.rides r 
      WHERE r.id = ride_id AND (r.rider_id = auth.uid() OR r.driver_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- 8. Wallets Policies
CREATE POLICY "Allow wallet owners to view own balance" ON public.wallets
  FOR SELECT TO authenticated USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- 9. Wallet Transactions Policies
CREATE POLICY "Allow wallet owners to view own ledger entries" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (
    wallet_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- 10. Ratings Policies
CREATE POLICY "Allow participants to view relevant reviews" ON public.ratings
  FOR SELECT TO authenticated USING (
    rater_id = auth.uid() 
    OR ratee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

CREATE POLICY "Allow users to post ratings" ON public.ratings
  FOR INSERT TO authenticated WITH CHECK (rater_id = auth.uid());

-- 11. Notifications Policies
CREATE POLICY "Allow users to view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Allow users to modify own notifications read status" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 12. Admin Settings Policies
CREATE POLICY "Allow authenticated users to read settings config" ON public.admin_settings
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Only admins can modify settings config" ON public.admin_settings
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- 13. Admin Audit Logs Policies
CREATE POLICY "Only admins can interact with audit logs" ON public.admin_audit_logs
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );
