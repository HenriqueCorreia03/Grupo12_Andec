import { Module } from '@nestjs/common';
import { AbcService } from './abc.service';
import { ArtigosController } from './artigos.controller';
import { ComparacaoService } from './comparacao.service';
import { DetalheOndaController } from './detalhe-onda.controller';
import { DetalheOndaService } from './detalhe-onda.service';
import { IndicadoresService } from './indicadores.service';
import { MatrizService } from './matriz.service';
import { OndasEPedidosController } from './ondas-e-pedidos.controller';
import { PedidosDivididosService } from './pedidos-divididos.service';
import { PickingController } from './picking.controller';
import { PickingService } from './picking.service';
import { SerieMensalService } from './serie-mensal.service';
import { VisaoGeralController } from './visao-geral.controller';
import { ZonasController } from './zonas.controller';
import { ZonasService } from './zonas.service';

@Module({
  controllers: [
    VisaoGeralController,
    ArtigosController,
    OndasEPedidosController,
    PickingController,
    ZonasController,
    DetalheOndaController,
  ],
  providers: [
    ComparacaoService,
    IndicadoresService,
    AbcService,
    MatrizService,
    PedidosDivididosService,
    PickingService,
    ZonasService,
    DetalheOndaService,
    SerieMensalService,
  ],
})
export class IndicadoresModule {}
