import { Controller, Get, Query } from '@nestjs/common';
import { lerFiltros } from './filtros';
import { type ZonasDoPicking, ZonasService } from './zonas.service';

@Controller('api/artigos/zonas')
export class ZonasController {
  constructor(private readonly zonas: ZonasService) {}

  @Get()
  participacaoPorZona(@Query() query: Record<string, unknown>): Promise<ZonasDoPicking> {
    return this.zonas.zonas(lerFiltros(query));
  }
}
