import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EvidenciasService } from './evidencias.service';
import { EvidenciasController } from './evidencias.controller';
import { Evidencias } from './entities/evidencia.entity';
import { RevisionGcController } from './revision-gc.controller';
import { RevisionGcService } from './revision-gc.service';

@Module({
  imports: [TypeOrmModule.forFeature([Evidencias]), HttpModule],
  controllers: [EvidenciasController, RevisionGcController],
  providers: [EvidenciasService, RevisionGcService],
  exports: [TypeOrmModule],
})
export class EvidenciasModule {}