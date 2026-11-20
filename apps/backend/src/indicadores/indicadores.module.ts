import { Module } from '@nestjs/common';
import { AbcService } from './abc.service';
import { ArtigosController } from './artigos.controller';
import { IndicadoresService } from './indicadores.service';
import { VisaoGeralController } from './visao-geral.controller';

@Module({
  controllers: [VisaoGeralController, ArtigosController],
  providers: [IndicadoresService, AbcService],
})
export class IndicadoresModule {}
