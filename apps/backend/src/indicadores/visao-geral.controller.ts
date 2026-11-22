import { Controller, Get, Query } from '@nestjs/common';
import { ComparacaoService } from './comparacao.service';
import { lerFiltros } from './filtros';
import { IndicadoresService, VisaoGeral } from './indicadores.service';
import { type SerieMensal, SerieMensalService } from './serie-mensal.service';

@Controller('api/visao-geral')
export class VisaoGeralController {
  constructor(
    private readonly indicadores: IndicadoresService,
    private readonly comparacao: ComparacaoService,
    private readonly serie: SerieMensalService,
  ) {}

  @Get()
  visaoGeral(@Query() query: Record<string, unknown>): Promise<VisaoGeral> {
    return this.comparacao.comparar(lerFiltros(query), (f) => this.indicadores.visaoGeral(f));
  }

  /** Série mensal por dia com atividade (todos os meses dos dados; o filtro de período não a corta). */
  @Get('serie-mensal')
  serieMensal(@Query() query: Record<string, unknown>): Promise<SerieMensal> {
    return this.serie.serieMensal(lerFiltros(query));
  }
}
