# Aerospace AR Work Instruction Authoring Platform

> **Browser-based POC** — Build, author, and deliver AR-ready work instructions on top of 3D aerospace models.

---

## Project Overview

This repository contains the browser-based Proof of Concept (POC) for an **Aerospace AR Work Instruction Authoring Platform** — a tool that allows engineers and technical authors to:

- Create step-by-step AR work instructions layered on top of interactive 3D models
- Author structured workflows with annotations, callouts, and guided sequences
- Generate execution-ready AR guidance for use in industrial and maintenance contexts

The POC is fully browser-based. No headset or specialized AR hardware is required to author or review instructions.

---

## Current POC Scope

The POC is structured around three modules:

### Module 1 — Browser Authoring Portal
A web application where authors create and edit AR work instructions.

- Upload and view 3D models (GLB/GLTF)
- Annotate models with step instructions, callouts, and highlights
- Build multi-step workflows with ordering and branching
- Preview instructions in the browser before publishing

### Module 2 — Guide Runtime Viewer
A browser-based viewer that renders authored work instructions.

- Load and display published work instruction packages
- Navigate steps sequentially with 3D context
- Highlight relevant model parts per step
- Designed for use on tablets, laptops, and workstations

### Module 3 — Backend Services
API layer connecting the Authoring Portal and Guide Runtime.

- Store and retrieve work instruction packages
- Manage 3D model assets
- Handle user sessions and versioning
- Provide REST API consumed by both frontend modules

---

## Technology Stack

### Frontend
- **React** — UI framework for both Portal and Runtime modules
- **TypeScript** — Full type safety throughout
- **Three.js** — 3D model rendering and scene management
- **Vite** — Development server and build toolchain

### Backend
- **ASP.NET Core** or **Node.js** — REST API and business logic
- **PostgreSQL** — Persistent storage for work instructions, assets, and metadata

### Supporting Libraries
- **React Three Fiber** — React integration layer for Three.js
- **Zustand** — Client-side state management
- **shadcn/ui + Tailwind CSS** — UI components and styling

---

## Repository Structure

```
01_ProductStudio/
├── src/                            # Frontend source (React/TypeScript)
│   ├── app/                        # App entry and layout
│   ├── components/                 # UI components
│   │   ├── layout/                 # Structural layout (TopBar, Sidebar, Viewport, Inspector)
│   │   ├── configurator/           # 3D model interaction components (reused from v0)
│   │   └── ui/                     # shadcn base components
│   ├── three/                      # Three.js / React Three Fiber integration
│   ├── services/                   # File loading, conversion, caching
│   ├── store/                      # Zustand state management
│   ├── types/                      # TypeScript type definitions
│   └── utils/                      # Shared utilities
├── docs/                           # Active project documentation
│   ├── architecture/               # System design documents
│   ├── product/                    # Product requirements and scope
│   ├── development/                # Developer guides and standards
│   ├── api/                        # API specifications
│   ├── deployment/                 # Deployment and environment guides
│   ├── decisions/                  # Architecture Decision Records (ADRs)
│   ├── roadmap/                    # Sprint and feature roadmap
│   ├── audit/                      # Repository audit and migration reports
│   └── legacy/                     # Archived docs from previous project iteration
├── public/                         # Static assets
├── dist/                           # Production build output (gitignored)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/architecture/system-overview.md) | High-level system design for all three modules |
| [Development Rules](docs/development/current-development-rules.md) | Coding standards, scope boundaries, branch strategy |
| [Repository Audit](docs/audit/repository-audit.md) | Audit of all files — keep/archive decisions |
| [Repository Link Audit](docs/audit/repository-link-audit.md) | Stale URLs identified and replaced |
| [Conflict Analysis](docs/audit/conflict-analysis.md) | Documentation conflicts with current POC scope |

---

## Legacy Documentation

All documentation from the previous project iteration (WebGL Product Configurator) has been preserved in [`docs/legacy/`](docs/legacy/README.md). These files are **not active documentation** — they are retained for historical reference only.

---

## Project Status

> **Phase:** POC — Active Development  
> **Repository:** `01_ProductStudio`  
> **Last restructured:** 2026-06-08

This is a live proof-of-concept. Architecture and scope may evolve. Always refer to `docs/` for the current project direction.
