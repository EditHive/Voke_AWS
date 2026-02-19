-- Enable read access for all authenticated users to profiles
-- This allows the admin dashboard to fetch the list of all users
create policy "Enable read access for all users"
on "public"."profiles"
as PERMISSIVE
for SELECT
to authenticated
using (true);
