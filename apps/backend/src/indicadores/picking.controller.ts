import { Controller, Get, Query } from '@nestjs/common';
import { lerFiltros } from './filtros';
import { type PickingDasOndas, PickingService } from './picking.service';

@Controller('api/ondas-e-pedidos/picking')
export class PickingController {
  constructor(private readonly picking: PickingService) {}

  @Get()
  indicadores(@Query() query: Record<string, unknown>): Promise<PickingDasOndas> {
    return this.picking.picking(lerFiltros(query));
  }
}
