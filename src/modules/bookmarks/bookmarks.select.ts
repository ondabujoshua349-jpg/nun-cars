import type { Prisma } from '../../generated/prisma/client';

export const bookmarkSelect = {
  id: true,
  title: true,
  description: true,
  link: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BookmarkSelect;

export type BookmarkView = Prisma.BookmarkGetPayload<{
  select: typeof bookmarkSelect;
}>;
