import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { BooksService } from './books.service';
import { ListBooksQueryDto } from './dto';

describe('BooksService', () => {
  let service: BooksService;
  const prisma = {
    $transaction: jest.fn((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    ),
    book: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [BooksService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(BooksService);
  });

  it('paginates and filters the list by author', async () => {
    prisma.book.findMany.mockResolvedValue([{ id: 'b1' }]);
    prisma.book.count.mockResolvedValue(45);
    const query = plainToInstance(ListBooksQueryDto, {
      page: 3,
      limit: 20,
      authorId: 'a1',
    });

    const result = await service.findAll(query);

    expect(prisma.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: 'a1' },
        skip: 40,
        take: 20,
      }),
    );
    expect(result.meta).toEqual({
      page: 3,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it('throws NotFoundException for an unknown book', async () => {
    prisma.book.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates books for the given author', async () => {
    await service.create({ title: 'Things Fall Apart', authorId: 'a1' });

    expect(prisma.book.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'Things Fall Apart', authorId: 'a1' },
      }),
    );
  });
});
