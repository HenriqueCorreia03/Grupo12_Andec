import { Module } from '@nestjs/common';
import { DatabaseModule } from './db/database.module';
import { IndicadoresModule } from './indicadores/indicadores.module';

@Module({
  imports: [DatabaseModule, IndicadoresModule],
})
export class AppModule {}
