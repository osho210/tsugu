import { Module } from '@nestjs/common';

import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AppLogger } from '@/infrastructure/logging/app-logger';

/**
 * アプリケーション全体の依存関係を構成するルートModule。
 */
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, AppLogger],
})
export class AppModule {}
