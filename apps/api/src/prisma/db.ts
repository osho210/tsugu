import 'dotenv/config';

import postgres from '@prisma/orm-postgres/runtime';

import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

/**
 * アプリケーションから利用するPrismaデータベースクライアント。
 * @remarks
 * データベースアクセスの入口を共有し、接続設定を一箇所に集約する。
 */
export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
