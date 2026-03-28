---
title: Sample Plan
date: 2026-03-28
---

# Sample Project Plan

This is a test document for Markup.

## Architecture

The system uses a modular monolith with clear service boundaries.

### Database Layer

We'll use PostgreSQL with pgvector for embeddings support.

- Connection pooling via PgBouncer
- Read replicas for analytics queries
- Automatic failover with Patroni

### API Design

RESTful API with versioned endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/v1/plans | GET | List all plans |
| /api/v1/plans/:id | GET | Get a specific plan |
| /api/v1/plans | POST | Create a new plan |

```typescript
interface Plan {
  id: string
  title: string
  content: string
  status: 'draft' | 'review' | 'approved'
  createdAt: Date
}
```

## Implementation Timeline

### Phase 1: Foundation

- [ ] Set up project scaffolding
- [ ] Implement core data models
- [ ] Build basic API endpoints

### Phase 2: Features

- [ ] Add real-time collaboration
- [ ] Implement comment system
- [ ] Build notification pipeline

## Risk Analysis

> The main risk is timeline pressure. We should plan for 20% buffer on each phase.

Key risks:
1. **Technical complexity** — The real-time system needs careful design
2. **Third-party dependencies** — External API rate limits could bottleneck
3. **Team capacity** — Two developers on a tight schedule
