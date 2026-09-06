import { Injectable } from '@nestjs/common';

/**
 * アプリケーションのルートUseCaseを提供するService。
 */
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
