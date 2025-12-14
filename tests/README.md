# Tests

## Backend Tests

Run backend tests with pytest:

```bash
cd backend
pytest ../tests/
```

Or from the project root:

```bash
pytest tests/
```

## Frontend Tests

Frontend tests can be added using Jest and React Testing Library (to be configured in Phase 2).

## Test Coverage

Run tests with coverage:

```bash
pytest tests/ --cov=backend --cov-report=html
```

