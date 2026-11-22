import { Module } from '@nestjs/common';
import { QualidadeController } from './qualidade.controller';
import { QualidadeService } from './qualidade.service';

/** Módulo de qualidade dos dados (spec, "Módulos do backend", 3): exclusões, decomposições e listas estáticas. */
@Module({
  controllers: [QualidadeController],
  providers: [QualidadeService],
})
export class QualidadeModule {}
