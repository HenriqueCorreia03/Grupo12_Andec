import { Controller, Get, Query } from '@nestjs/common';
import { lerFiltros } from './filtros';
import { type CargaPorPeriodo, type DividosPorPeriodo, PeriodosService } from './periodos.service';

@Controller('api/ondas-e-pedidos')
export class PeriodosController {
  constructor(private readonly periodos: PeriodosService) {}

  @Get('divididos-por-periodo')
  divididosPorPeriodo(@Query() query: Record<string, unknown>): Promise<DividosPorPeriodo> {
    return this.periodos.divididosPorPeriodo(lerFiltros(query));
  }

  @Get('carga')
  carga(@Query() query: Record<string, unknown>): Promise<CargaPorPeriodo> {
    return this.periodos.carga(lerFiltros(query));
  }
}
