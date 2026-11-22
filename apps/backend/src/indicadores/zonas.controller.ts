import { Controller, Get, Query } from '@nestjs/common';
import { ComparacaoService } from './comparacao.service';
import { lerFiltros } from './filtros';
import { type ZonasDoPicking, ZonasService } from './zonas.service';

@Controller('api/artigos/zonas')
export class ZonasController {
  constructor(
    private readonly zonas: ZonasService,
    private readonly comparacao: ComparacaoService,
  ) {}

  @Get()
  participacaoPorZona(@Query() query: Record<string, unknown>): Promise<ZonasDoPicking> {
    return this.comparacao.comparar(lerFiltros(query), (f) => this.zonas.zonas(f));
  }
}
