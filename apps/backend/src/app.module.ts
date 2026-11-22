import { Module } from '@nestjs/common';
import { DatabaseModule } from './db/database.module';
import { IndicadoresModule } from './indicadores/indicadores.module';
import { QualidadeModule } from './qualidade/qualidade.module';

@Module({
  imports: [DatabaseModule, IndicadoresModule, QualidadeModule],
})
export class AppModule {}
