import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { ChapatiService } from './chapati.service';

@Public()
@Controller('kevo')
export class ChapatiController {
  constructor(private chapatiService: ChapatiService) {}

  @Get('/')
  getChapatis() {
    return this.chapatiService.findChapatis();
  }
}
