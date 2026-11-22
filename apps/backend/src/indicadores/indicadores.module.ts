import { Module } from '@nestjs/common';
import { AbcService } from './abc.service';
import { ArtigosController } from './artigos.controller';
import { IndicadoresService } from './indicadores.service';
import { OndasEPedidosController } from './ondas-e-pedidos.controller';
import { PedidosDivididosService } from './pedidos-divididos.service';
import { VisaoGeralController } from './visao-geral.controller';

@Module({
  controllers: [VisaoGeralController, ArtigosController, OndasEPedidosController],
  providers: [IndicadoresService, AbcService, PedidosDivididosService],
})
export class IndicadoresModule {}
