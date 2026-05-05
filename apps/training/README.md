# Ark Training Portal

[![Deploy](https://github.com/arkinstitutebc/ark-training-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/arkinstitutebc/ark-training-portal/actions/workflows/ci.yml)

Training and student management portal for Ark Institute ERP.

## Tech Stack
- SolidJS
- Vike (SSR framework)
- Tailwind CSS 4
- Lucide Icons

## Design System
- Primary: #193a7a (Ark Blue)
- Accent: #c80100 (Ark Red)
- Font: Montserrat

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Pages

| Route | Page | Status |
|-------|------|--------|
| `/` | Dashboard | ✅ |
| `/students` | Student Management | ✅ |
| `/students/create` | Add Student | ✅ |
| `/batch/@id` | Batch Details | ✅ |

## Features
- ✅ Batch management (₱3M budget, 200 students)
- ✅ Student enrollment with photo/PSA certificate upload
- ✅ Attendance tracking
- ✅ Certificate management
- ✅ Student status tracking (enrolled, in training, certified, dropped)

<!-- monorepo CI test -->
