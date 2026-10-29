import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import type { PublicUser } from './users.select';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  @Get('me')
  getMe(@CurrentUser() user: PublicUser) {
    return user;
  }
}
