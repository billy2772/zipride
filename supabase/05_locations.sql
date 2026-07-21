-- Create active driver coordinates/locations table with PostGIS support
CREATE TABLE IF NOT EXISTS public.driver_locations (
  driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  coords GEOGRAPHY(Point, 4326) NOT NULL, -- Spatial indexing point (SRID 4326 is standard GPS coordinates)
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading NUMERIC(5,2) DEFAULT 0.00, -- Heading/bearing in degrees (0 - 360)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Auto-update coords column when lat/lng updates
CREATE OR REPLACE FUNCTION update_driver_coords_geography()
RETURNS TRIGGER AS $$
BEGIN
    NEW.coords = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER sync_driver_locations_coords
    BEFORE INSERT OR UPDATE ON public.driver_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_coords_geography();
