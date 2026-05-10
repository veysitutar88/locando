// Compat re-export: the canonical definitions live in
// `@/shared/errors/app-error` (Chunk #8). This file is preserved so
// existing imports (`import { NotFoundError } from '@/shared/db/errors'`)
// from the repository layer continue to work without modification.

export {
  NotFoundError,
  UniqueConstraintError,
} from '@/shared/errors/app-error';
