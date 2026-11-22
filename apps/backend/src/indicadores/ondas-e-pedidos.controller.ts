import { Controller, Get, Query } from '@nestjs/common';
import { lerFiltros } from './filtros';
import { type OndasEPedidos, PedidosDivididosService } from './pedidos-divididos.service';

@Controller('api/ondas-e-pedidos')
export class OndasEPedidosController {
  constructor(private readonly pedidosDivididos: PedidosDivididosService) {}

  @Get()
  ondasEPedidos(@Query() query: Record<string, unknown>): Promise<OndasEPedidos> {
    return this.pedidosDivididos.ondasEPedidos(lerFiltros(query));
  }
}
