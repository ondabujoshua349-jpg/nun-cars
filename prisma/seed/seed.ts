import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon from 'argon2';
import { PrismaClient } from '../../src/generated/prisma/client';

/** Shared password for all seeded accounts — development only. */
const SEED_PASSWORD = 'Password123!';

if (process.env.NODE_ENV === 'production') {
  console.error(
    'Refusing to seed: this script wipes data (NODE_ENV=production).',
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function seed() {
  console.log('Seeding database...');

  // Users cascade-delete their bookmarks. Authors restrict deletes, so books go first.
  await prisma.user.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();

  const hash = await argon.hash(SEED_PASSWORD);

  await prisma.user.create({
    data: {
      email: 'alex@example.com',
      hash,
      firstName: 'Alex',
      lastName: 'Anderson',
      bookmarks: {
        create: [
          {
            title: 'NestJS Documentation',
            description: 'A progressive Node.js framework',
            link: 'https://docs.nestjs.com',
          },
          {
            title: 'Prisma Documentation',
            description: 'Next-generation ORM for Node.js and TypeScript',
            link: 'https://www.prisma.io/docs',
          },
        ],
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      hash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      bookmarks: {
        create: [
          {
            title: 'Stack Overflow',
            description: 'For when I get stuck',
            link: 'https://stackoverflow.com',
          },
        ],
      },
    },
  });

  await prisma.author.create({
    data: {
      name: 'Chinua Achebe',
      bio: 'Nigerian novelist and critic.',
      books: {
        create: [
          {
            title: 'Things Fall Apart',
            description: 'The life and downfall of Okonkwo in colonial Nigeria',
          },
          {
            title: 'Arrow of God',
            description: 'A chief priest confronts colonial rule',
          },
        ],
      },
    },
  });

  await prisma.author.create({
    data: {
      name: 'Ngũgĩ wa Thiong’o',
      bio: 'Kenyan writer and academic.',
      books: {
        create: [
          {
            title: 'Weep Not, Child',
            description: 'A family caught up in the Mau Mau uprising',
          },
          {
            title: 'Petals of Blood',
            description: 'A murder investigation in post-independence Kenya',
          },
        ],
      },
    },
  });

  await prisma.author.create({
    data: {
      name: 'Chimamanda Ngozi Adichie',
      books: {
        create: [
          {
            title: 'Half of a Yellow Sun',
            description: 'Three lives during the Nigerian Civil War',
          },
        ],
      },
    },
  });

  console.log(`Seeded 2 users (password: ${SEED_PASSWORD}).`);
  console.log('Seeded 3 authors with 5 books.');
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
