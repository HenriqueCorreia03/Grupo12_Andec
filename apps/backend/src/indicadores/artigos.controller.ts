import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { AbcService, type ReferenciasAbc, type TamanhosReferencia } from './abc.service';
import { lerFiltros } from './filtros';

@Controller('api/artigos')
export class ArtigosController {
  constructor(private readonly abc: AbcService) {}

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
