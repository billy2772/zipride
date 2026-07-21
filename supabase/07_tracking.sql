-- Create ride tracking logs for auditing active trips paths
CREATE TABLE IF NOT EXISTS public.ride_tracking_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  coords GEOGRAPHY(Point, 4326) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger function to automatically set geog from lat/lng on logs insertion
CREATE OR REPLACE FUNCTION set_tracking_log_geography()
RETURNS TRIGGER AS $$
BEGIN
    NEW.coords = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_tracking_log_inserted
    BEFORE INSERT ON public.ride_tracking_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_tracking_log_geography();
