import type { Prisma } from '../../generated/prisma/client';

export const bookSelect = {
  id: true,
  title: true,
  description: true,
  author: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BookSelect;

export type BookView = Prisma.BookGetPayload<{
  select: typeof bookSelect;
}>;
