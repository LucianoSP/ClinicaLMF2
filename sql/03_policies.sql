-- Enable RLS on the divergencias table
ALTER TABLE divergencias ENABLE ROW LEVEL SECURITY;

-- Policy for insert
CREATE POLICY "Enable insert for authenticated users" ON divergencias
    FOR INSERT 
    WITH CHECK (true);

-- Policy for select
CREATE POLICY "Enable select for authenticated users" ON divergencias
    FOR SELECT 
    USING (true);

-- Policy for update
CREATE POLICY "Enable update for authenticated users" ON divergencias
    FOR UPDATE 
    USING (true);

-- Policy for delete
CREATE POLICY "Enable delete for authenticated users" ON divergencias
    FOR DELETE 
    USING (true);

-- Grant all permissions to authenticated users
GRANT ALL ON divergencias TO authenticated;
GRANT ALL ON divergencias TO service_role;
GRANT ALL ON divergencias TO anon;
