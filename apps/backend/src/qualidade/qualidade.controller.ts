import { Controller, Get, Query } from '@nestjs/common';
import { lerFiltros } from '../indicadores/filtros';
import { Qualidade, QualidadeService } from './qualidade.service';

@Controller('api/qualidade')
export class QualidadeController {
  constructor(private readonly qualidade: QualidadeService) {}

  /** Os filtros são lidos (e validados) só para os devolver como "não aplicáveis": a página usa o dataset completo. */
  @Get()
  obter(@Query() query: Record<string, unknown>): Promise<Qualidade> {
    return this.qualidade.qualidade(lerFiltros(query));
  }
}
