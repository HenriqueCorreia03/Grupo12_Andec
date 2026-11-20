import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { CLASSES_ABC, type ClasseAbc } from './abc';
import { AbcService, type ReferenciasAbc, type TamanhosReferencia } from './abc.service';

@Controller('api/artigos')
export class ArtigosController {
  constructor(private readonly abc: AbcService) {}

  /** ABC global; `?classe=A|B|C` devolve só as referências dessa classe (drill-down). */
  @Get('abc')
  referencias(@Query('classe') classe?: string): Promise<ReferenciasAbc> {
    return this.abc.referencias(parseClasse(classe));
  }

  /** Drill-down referência → unidades por tamanho normalizado. */
  @Get('referencias/:referencia/tamanhos')
  tamanhos(@Param('referencia') referencia: string): Promise<TamanhosReferencia> {
    return this.abc.tamanhos(referencia);
  }
}

function parseClasse(valor: string | undefined): ClasseAbc | null {
  if (valor === undefined || valor === '') return null;
  if ((CLASSES_ABC as string[]).includes(valor)) return valor as ClasseAbc;
  throw new BadRequestException(`Classe ABC inválida "${valor}" (use A, B ou C).`);
}
