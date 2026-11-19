import { Controller, Get } from '@nestjs/common';
import { IndicadoresService, VisaoGeral } from './indicadores.service';

@Controller('api/visao-geral')
export class VisaoGeralController {
  constructor(private readonly indicadores: IndicadoresService) {}

  @Get()
  visaoGeral(): Promise<VisaoGeral> {
    return this.indicadores.visaoGeral();
  }
}
