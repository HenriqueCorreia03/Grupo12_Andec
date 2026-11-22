import { Controller, Get } from '@nestjs/common';
import { type PickingDasOndas, PickingService } from './picking.service';

@Controller('api/ondas-e-pedidos/picking')
export class PickingController {
  constructor(private readonly picking: PickingService) {}

  @Get()
  indicadores(): Promise<PickingDasOndas> {
    return this.picking.picking();
  }
}
