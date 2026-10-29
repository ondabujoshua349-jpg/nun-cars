// Loaded before each e2e test file (see jest-e2e.json `setupFiles`).
// ConfigModule validates env when AppModule is imported, so these must be set first.
process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ??= 'e2e-test-secret-that-is-long-enough-1234';
