-- Modify divergencias table to allow NULL values for codigo_ficha
ALTER TABLE divergencias 
    ALTER COLUMN codigo_ficha DROP NOT NULL;
