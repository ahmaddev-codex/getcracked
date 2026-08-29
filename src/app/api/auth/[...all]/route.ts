import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth';

/** Better Auth's own endpoints. Public by necessity — see lib/access.ts. */
export const { GET, POST } = toNextJsHandler(getAuth().handler);
