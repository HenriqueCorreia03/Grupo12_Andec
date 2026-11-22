import { Controller, Get, Param } from '@nestjs/common';
import { type DetalheOnda, DetalheOndaService } from './detalhe-onda.service';

@Controller('api/ondas-e-pedidos/ondas')
export class DetalheOndaController {
  constructor(private readonly detalhe: DetalheOndaService) {}

  @Get(':onda')
  detalheDaOnda(@Param('onda') onda: string): Promise<DetalheOnda> {
    return this.detalhe.detalhe(onda);
  }
}
