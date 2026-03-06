# Trinity Library

## Setup

```bash
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test Accounts

| Role    | Email              | Password   |
|---------|--------------------|------------|
| Manager | admin@library.com  | admin123   |
| Member  | member@library.com | member123  |
