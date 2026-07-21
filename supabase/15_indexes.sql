-- 1. Standard B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_status ON public.driver_profiles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON public.vehicles(driver_id);

CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON public.rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);

CREATE INDEX IF NOT EXISTS idx_payments_ride_id ON public.payments(ride_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);

CREATE INDEX IF NOT EXISTS idx_ratings_ride_id ON public.ratings(ride_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON public.ratings(ratee_id);

-- Partial index for quick queries of unread user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread_by_user 
  ON public.notifications(user_id) 
  WHERE read = FALSE;

-- 2. Geospatial GIS (GiST) Indexes for Fast Spatial Range Queries
CREATE INDEX IF NOT EXISTS idx_driver_locations_spatial_coords 
  ON public.driver_locations USING GIST (coords);

CREATE INDEX IF NOT EXISTS idx_rides_pickup_spatial_coords 
  ON public.rides USING GIST (pickup_coords);

CREATE INDEX IF NOT EXISTS idx_rides_dropoff_spatial_coords 
  ON public.rides USING GIST (dropoff_coords);

CREATE INDEX IF NOT EXISTS idx_ride_tracking_logs_spatial_coords 
  ON public.ride_tracking_logs USING GIST (coords);
