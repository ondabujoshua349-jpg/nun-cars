import { Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { bookSelect, type BookView } from './books.select';
import { CreateBookDto, ListBooksQueryDto, UpdateBookDto } from './dto';

/**
 * Books are a shared catalogue, not owned by a user. An unknown `authorId`
 * (P2003) and a missing book (P2025) are translated to HTTP responses by the
 * global PrismaExceptionFilter.
 */
@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({
    page,
    limit,
    skip,
    authorId,
  }: ListBooksQueryDto): Promise<Paginated<BookView>> {
    const where = { authorId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        select: bookSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<BookView> {
    const book = await this.prisma.book.findUnique({
      where: { id },
      select: bookSelect,
    });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  create(dto: CreateBookDto): Promise<BookView> {
    return this.prisma.book.create({
      data: {
        title: dto.title,
        description: dto.description,
        authorId: dto.authorId,
      },
      select: bookSelect,
    });
  }

  update(id: string, dto: UpdateBookDto): Promise<BookView> {
    return this.prisma.book.update({
      where: { id },
      data: dto,
      select: bookSelect,
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.book.delete({ where: { id } });
  }
}
