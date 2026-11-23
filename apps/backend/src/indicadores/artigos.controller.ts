import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { AbcService, type ReferenciasAbc, type TamanhosReferencia } from './abc.service';
import { ComparacaoService } from './comparacao.service';
import { type EstabilidadeAbc, EstabilidadeService } from './estabilidade.service';
import { lerFiltros } from './filtros';
import { type PrioridadeDosArtigos, PrioridadeService } from './prioridade.service';

@Controller('api/artigos')
export class ArtigosController {
  constructor(
    private readonly abc: AbcService,
    private readonly prioridadeDosArtigos: PrioridadeService,
    private readonly estabilidadeDoAbc: EstabilidadeService,
    private readonly comparacao: ComparacaoService,
  ) {}

  /** Estabilidade do ABC mensal com o limiar de 10 un., comparada com o período anterior (ticket 10). */
  @Get('estabilidade')
  estabilidade(@Query() query: Record<string, unknown>): Promise<EstabilidadeAbc> {
    return this.comparacao.comparar(lerFiltros(query), (f) => this.estabilidadeDoAbc.estabilidade(f));
  }

  /** Ranking de prioridade da alavanca (a): paragens, localizações distintas, código (ticket 10). */
  @Get('prioridade')
  prioridade(@Query() query: Record<string, unknown>): Promise<PrioridadeDosArtigos> {
    return this.prioridadeDosArtigos.prioridade(lerFiltros(query));
  }

  /** ABC; `?classe=A|B|C` (classe global) devolve só as referências dessa classe (drill-down). */
  @Get('abc')
  referencias(@Query() query: Record<string, unknown>): Promise<ReferenciasAbc> {
    return this.abc.referencias(lerFiltros(query));
  }

  /** Drill-down referência → unidades por tamanho (no período filtrado). */
  @Get('referencias/:referencia/tamanhos')
  tamanhos(@Param('referencia') referencia: string, @Query() query: Record<string, unknown>): Promise<TamanhosReferencia> {
    const filtros = lerFiltros(query);
    if (filtros.referencia !== null && filtros.referencia !== referencia) {
      throw new BadRequestException(
        `O parâmetro referencia ("${filtros.referencia}") difere da referência do caminho ("${referencia}").`,
      );
    }
    return this.abc.tamanhos(referencia, filtros);
  }
}
