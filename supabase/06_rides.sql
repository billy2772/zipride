-- Create ride_status ENUM type safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ride_status') THEN
        CREATE TYPE ride_status AS ENUM ('searching', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled');
    END IF;
END$$;

-- Create payment_status ENUM type safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
    END IF;
END$$;

-- Create rides table
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status ride_status NOT NULL DEFAULT 'searching',
  pickup_address TEXT NOT NULL,
  pickup_coords GEOGRAPHY(Point, 4326),
  pickup_latitude DOUBLE PRECISION NOT NULL,
  pickup_longitude DOUBLE PRECISION NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_coords GEOGRAPHY(Point, 4326),
  dropoff_latitude DOUBLE PRECISION NOT NULL,
  dropoff_longitude DOUBLE PRECISION NOT NULL,
  fare NUMERIC(10, 2) NOT NULL,
  distance NUMERIC(6, 2) NOT NULL, -- distance in miles/km
  duration INTEGER NOT NULL, -- duration in seconds
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Trigger to sync PostGIS geography coordinates on rides table
CREATE OR REPLACE FUNCTION sync_ride_coords_geography()
RETURNS TRIGGER AS $$
BEGIN
    NEW.pickup_coords = ST_SetSRID(ST_MakePoint(NEW.pickup_longitude, NEW.pickup_latitude), 4326)::geography;
    NEW.dropoff_coords = ST_SetSRID(ST_MakePoint(NEW.dropoff_longitude, NEW.dropoff_latitude), 4326)::geography;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER sync_rides_locations_coords
    BEFORE INSERT OR UPDATE ON public.rides
    FOR EACH ROW
    EXECUTE FUNCTION sync_ride_coords_geography();
