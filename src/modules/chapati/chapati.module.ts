import { Module } from '@nestjs/common';
import { ChapatiController } from './chapati.controller';
import { ChapatiService } from './chapati.service';

@Module({
  controllers: [ChapatiController],
  providers: [ChapatiService],
})
export class ChapatiModule {}
