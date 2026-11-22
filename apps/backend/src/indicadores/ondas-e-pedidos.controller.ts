import { Controller, Get, Query } from '@nestjs/common';
import { ComparacaoService } from './comparacao.service';
import { lerFiltros } from './filtros';
import { type OndasEPedidos, PedidosDivididosService } from './pedidos-divididos.service';

@Controller('api/ondas-e-pedidos')
export class OndasEPedidosController {
  constructor(
    private readonly pedidosDivididos: PedidosDivididosService,
    private readonly comparacao: ComparacaoService,
  ) {}

  @Get()
  ondasEPedidos(@Query() query: Record<string, unknown>): Promise<OndasEPedidos> {
    return this.comparacao.comparar(lerFiltros(query), (f) => this.pedidosDivididos.ondasEPedidos(f));
  }
}
