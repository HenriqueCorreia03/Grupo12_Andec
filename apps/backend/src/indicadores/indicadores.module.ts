import { Module } from '@nestjs/common';
import { AbcService } from './abc.service';
import { ArtigosController } from './artigos.controller';
import { IndicadoresService } from './indicadores.service';
import { PickingController } from './picking.controller';
import { PickingService } from './picking.service';
import { VisaoGeralController } from './visao-geral.controller';
import { ZonasController } from './zonas.controller';
import { ZonasService } from './zonas.service';

@Module({
  controllers: [VisaoGeralController, ArtigosController, PickingController, ZonasController],
  providers: [IndicadoresService, AbcService, PickingService, ZonasService],
})
export class IndicadoresModule {}
