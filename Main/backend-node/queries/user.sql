CREATE TABLE IF NOT EXISTS "User"(
                    user_email VARCHAR PRIMARY KEY, 
                    user_name VARCHAR NOT NULL,
                    password_hash VARCHAR);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS password_hash VARCHAR;

INSERT INTO "User" (user_email, user_name)
VALUES
    ('nik@nik.com', 'nik')
ON CONFLICT (user_email) DO NOTHING;