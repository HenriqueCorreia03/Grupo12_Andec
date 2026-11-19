import { Module } from '@nestjs/common';
import { IndicadoresService } from './indicadores.service';
import { VisaoGeralController } from './visao-geral.controller';

@Module({
  controllers: [VisaoGeralController],
  providers: [IndicadoresService],
})
export class IndicadoresModule {}
