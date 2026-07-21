-- Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ratee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to update the driver's cached average rating dynamically
CREATE OR REPLACE FUNCTION public.update_driver_average_rating()
RETURNS trigger AS $$
BEGIN
  -- If the ratee has a driver profile, calculate their new average rating
  IF EXISTS (SELECT 1 FROM public.driver_profiles WHERE id = new.ratee_id) THEN
    UPDATE public.driver_profiles
    SET rating = (
      SELECT round(avg(rating)::numeric, 2)
      FROM public.ratings
      WHERE ratee_id = new.ratee_id
    )
    WHERE id = new.ratee_id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recalculate driver rating on reviews
CREATE OR REPLACE TRIGGER on_rating_inserted_update_driver
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_driver_average_rating();
