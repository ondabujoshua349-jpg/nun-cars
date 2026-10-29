import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Paginated,
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { bookmarkSelect, type BookmarkView } from './bookmarks.select';
import { CreateBookmarkDto, UpdateBookmarkDto } from './dto';

/**
 * Every query is scoped by `userId`, so users can only see and modify their
 * own bookmarks. Prisma errors (e.g. P2025 not found) are translated to HTTP
 * responses by the global PrismaExceptionFilter.
 */
@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    { page, limit, skip }: PaginationQueryDto,
  ): Promise<Paginated<BookmarkView>> {
    const where = { userId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.bookmark.findMany({
        where,
        select: bookmarkSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bookmark.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: string, id: string): Promise<BookmarkView> {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, userId },
      select: bookmarkSelect,
    });
    if (!bookmark) throw new NotFoundException('Bookmark not found');
    return bookmark;
  }

  create(userId: string, dto: CreateBookmarkDto): Promise<BookmarkView> {
    return this.prisma.bookmark.create({
      data: {
        title: dto.title,
        description: dto.description,
        link: dto.link,
        userId,
      },
      select: bookmarkSelect,
    });
  }

  update(
    userId: string,
    id: string,
    dto: UpdateBookmarkDto,
  ): Promise<BookmarkView> {
    return this.prisma.bookmark.update({
      where: { id, userId },
      data: dto,
      select: bookmarkSelect,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.prisma.bookmark.delete({ where: { id, userId } });
  }
}
