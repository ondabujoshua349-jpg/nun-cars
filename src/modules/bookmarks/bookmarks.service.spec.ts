import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { BookmarksService } from './bookmarks.service';

describe('BookmarksService', () => {
  let service: BookmarksService;
  const prisma = {
    $transaction: jest.fn((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    ),
    bookmark: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(BookmarksService);
  });

  it('paginates and scopes the list to the current user', async () => {
    prisma.bookmark.findMany.mockResolvedValue([{ id: 'b1' }]);
    prisma.bookmark.count.mockResolvedValue(45);
    const query = plainToInstance(PaginationQueryDto, { page: 3, limit: 20 });

    const result = await service.findAll('u1', query);

    expect(prisma.bookmark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' }, skip: 40, take: 20 }),
    );
    expect(result.meta).toEqual({
      page: 3,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it("throws NotFoundException for another user's bookmark", async () => {
    prisma.bookmark.findFirst.mockResolvedValue(null);

    await expect(service.findOne('u1', 'b-owned-by-u2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.bookmark.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b-owned-by-u2', userId: 'u1' } }),
    );
  });

  it('assigns new bookmarks to the current user', async () => {
    await service.create('u1', { title: 'Nest', link: 'https://nestjs.com' });

    expect(prisma.bookmark.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'Nest', link: 'https://nestjs.com', userId: 'u1' },
      }),
    );
  });

  it('only updates and deletes bookmarks owned by the current user', async () => {
    await service.update('u1', 'b1', { title: 'New' });
    await service.remove('u1', 'b1');

    expect(prisma.bookmark.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b1', userId: 'u1' } }),
    );
    expect(prisma.bookmark.delete).toHaveBeenCalledWith({
      where: { id: 'b1', userId: 'u1' },
    });
  });
});
