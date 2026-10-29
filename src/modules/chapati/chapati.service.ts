import { Injectable } from '@nestjs/common';

@Injectable()
export class ChapatiService {
  constructor() {}

  findChapatis() {
    return { message: 'ORDER YOUR CHAPATIS' };
  }
}
