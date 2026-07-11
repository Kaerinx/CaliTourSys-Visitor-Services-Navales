# CaliTourSys Backend

## SQLite Database Setup

Run migrations before starting a fresh local backend:

```powershell
npm run db:migrate
```

Add demo users and sample Product Development records:

```powershell
npm run db:seed
```

The seed command is safe to run more than once. Demo users are updated, while sample Product Development records use fixed IDs and will not be duplicated.

Reset is intentionally protected because it deletes the local SQLite tables and recreates them:

```powershell
$env:CONFIRM_DB_RESET='YES'
npm run db:reset
Remove-Item Env:\CONFIRM_DB_RESET
```

The server also runs migrations during startup, but seed data is manual so sample records are added only when intended.
