import type { Prisma } from '../../generated/prisma/client';

/** User fields that are safe to return to clients — never includes `hash`. */
export const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;
