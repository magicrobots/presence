import express, { Request, Response, NextFunction } from 'express';
import { preferencesRouter } from './routes/preferences';
import { sendError } from './lib/response';

const app = express();
const PORT = process.env['PORT'] ?? 3001;

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/preferences', preferencesRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  sendError(res, 'Not found', 404, 'NOT_FOUND');
});

// 500 error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
});

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

export default app;
