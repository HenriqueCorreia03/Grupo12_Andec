import { Controller, Get, Query } from '@nestjs/common';
import { lerFiltros } from './filtros';
import { IndicadoresService, VisaoGeral } from './indicadores.service';

@Controller('api/visao-geral')
export class VisaoGeralController {
  constructor(private readonly indicadores: IndicadoresService) {}

  @Get()
  visaoGeral(@Query() query: Record<string, unknown>): Promise<VisaoGeral> {
    return this.indicadores.visaoGeral(lerFiltros(query));
  }
}
