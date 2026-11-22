import { Controller, Get, Query } from '@nestjs/common';
import { ComparacaoService } from './comparacao.service';
import { lerFiltros } from './filtros';
import { type PickingDasOndas, PickingService } from './picking.service';

@Controller('api/ondas-e-pedidos/picking')
export class PickingController {
  constructor(
    private readonly picking: PickingService,
    private readonly comparacao: ComparacaoService,
  ) {}

  @Get()
  indicadores(@Query() query: Record<string, unknown>): Promise<PickingDasOndas> {
    return this.comparacao.comparar(lerFiltros(query), (f) => this.picking.picking(f));
  }
}
