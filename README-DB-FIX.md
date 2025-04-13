# Database Schema Fix

This document provides instructions on how to fix the database schema issues that are causing errors in the application.

## Issues

The application is experiencing the following database schema issues:

1. The `Product` model is missing the `descriptionHtml` column
2. The `Collection` model is missing the `handle` column

These issues are causing 500 errors when fetching collections and products.

## Solution

We've created scripts to fix these issues. Follow these steps to apply the fixes:

### Option 1: Using npm scripts

Run the following command in the `frontend` directory:

```bash
npm run fix:db
```

This will run both the schema fix and migration scripts.

### Option 2: Manual fix

If the npm scripts don't work, you can manually fix the issues by running the following SQL commands in your database:

```sql
-- Add descriptionHtml to Product if it doesn't exist
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "descriptionHtml" TEXT;

-- Add handle to Collection if it doesn't exist
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "handle" TEXT;
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_handle_key" UNIQUE ("handle");

-- Update existing collections to have a handle based on their name
UPDATE "Collection" SET "handle" = LOWER(REGEXP_REPLACE("name", '\s+', '-', 'g')) 
WHERE "handle" IS NULL;
```

### Option 3: Using Prisma Migrate

If you prefer to use Prisma Migrate, you can run:

```bash
npx prisma migrate deploy
```

This will apply all pending migrations, including the ones that add the missing columns.

## Verification

After applying the fixes, restart your application and verify that:

1. The collections API endpoints work correctly
2. The shop page loads without errors
3. The home page displays featured collections correctly

## Troubleshooting

If you continue to experience issues:

1. Check the database connection in your `.env` file
2. Verify that your Supabase project is active and running
3. Check the Prisma schema in `prisma/schema.prisma` to ensure it matches your database
4. Run `npx prisma db pull` to update your Prisma schema based on the database
5. Run `npx prisma generate` to regenerate the Prisma client 