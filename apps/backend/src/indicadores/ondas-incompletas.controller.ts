import { Controller, Get, Query } from '@nestjs/common';
import { lerFiltros } from './filtros';
import { type OndasIncompletas, OndasIncompletasService } from './ondas-incompletas.service';

@Controller('api/ondas-e-pedidos/ondas-incompletas')
export class OndasIncompletasController {
  constructor(private readonly incompletas: OndasIncompletasService) {}

  @Get()
  ondasIncompletas(@Query() query: Record<string, unknown>): Promise<OndasIncompletas> {
    return this.incompletas.ondasIncompletas(lerFiltros(query));
  }
}
