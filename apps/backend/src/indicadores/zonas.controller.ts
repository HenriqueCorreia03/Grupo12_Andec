import { Controller, Get } from '@nestjs/common';
import { type ZonasDoPicking, ZonasService } from './zonas.service';

@Controller('api/artigos/zonas')
export class ZonasController {
  constructor(private readonly zonas: ZonasService) {}

  @Get()
  participacaoPorZona(): Promise<ZonasDoPicking> {
    return this.zonas.zonas();
  }
}
