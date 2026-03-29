---
title: "Reviewed Plan"
date: 2026-03-28
markup_reviewed: true
markup_reviewer: "tester"
markup_reviewed_at: "2026-03-28T14:00:00Z"
markup_status: "changes_requested"
---

# Deployment Strategy

This document outlines our deployment approach.

## CI/CD Pipeline

We use GitHub Actions for continuous integration and deployment.
<!-- @markup {"id":"c1","type":"inline","anchor":"h2:CI/CD Pipeline","author":"tester","ts":"2026-03-28T14:01:00Z"} Consider adding a staging environment step before production deployment. -->

### Build Steps

1. Lint and type-check
2. Run unit tests
3. Run integration tests
4. Build Docker image
5. Push to registry

## Rollback Plan

If a deployment fails, we revert to the previous Docker image tag.
<!-- @markup {"id":"c2","type":"inline","anchor":"h2:Rollback Plan","author":"tester","ts":"2026-03-28T14:02:00Z"} This is too simplistic. What about database migrations that can't be rolled back? -->

## Monitoring

We use Datadog for monitoring and alerting.

<!-- @markup-doc-comments
{"id":"d1","type":"document","author":"tester","ts":"2026-03-28T14:05:00Z","body":"Overall the plan needs more detail on failure scenarios. What happens when things go wrong?"}
{"id":"d2","type":"document","author":"tester","ts":"2026-03-28T14:06:00Z","body":"Add a section on security scanning in the CI pipeline."}
-->
