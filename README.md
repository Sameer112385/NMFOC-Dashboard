# SAP CN41 Progress Simulation Dashboard

Next.js App Router application for project cost control using:

- Supabase Auth
- Supabase Database
- Supabase Storage
- SheetJS / xlsx for CN41 parsing
- Recharts for dashboard charts
- PDF export hooks for jsPDF or React-PDF

## What is included

- Login page
- Project list
- CN41 upload flow
- Revenue WBS analytics
- PM daily updates
- Simulation dashboard
- SAP vs simulation comparison
- Risk alerts
- Reports and settings pages
- Supabase SQL schema

## Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in the three Supabase environment variables.
4. Run the SQL in `supabase/schema.sql`.
5. Install dependencies and start the app with your normal Next.js workflow.

## Notes

- CN41 uploads are stored in Supabase Storage.
- The app falls back to demo data when Supabase is not yet configured.
- The PDF report page currently includes the report layout and export hook points.
