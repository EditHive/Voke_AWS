-- Allow users to delete their own profile
-- This is critical for account deletion functionality

CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Ensure RLS is enabled (should be already, but safe to re-assert)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
