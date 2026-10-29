import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListBooksQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  authorId?: string;
}
