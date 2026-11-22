import { Controller, Get } from '@nestjs/common';
import { type OndasEPedidos, PedidosDivididosService } from './pedidos-divididos.service';

@Controller('api/ondas-e-pedidos')
export class OndasEPedidosController {
  constructor(private readonly pedidosDivididos: PedidosDivididosService) {}

  @Get()
  ondasEPedidos(): Promise<OndasEPedidos> {
    return this.pedidosDivididos.ondasEPedidos();
  }
}
