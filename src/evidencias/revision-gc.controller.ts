import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RevisionGcService } from './revision-gc.service';

@Controller('evidencias')
export class RevisionGcController {
  constructor(private readonly revisionGcService: RevisionGcService) {}

  // El frontend sube el PDF a: POST /evidencias/revisar
  // Body: FormData con campos "documento" (archivo) y "identificador" (texto)
  @Post('revisar')
  @UseInterceptors(FileInterceptor('documento'))
  async revisarGc(
    @UploadedFile() file: Express.Multer.File,
    @Body('identificador') identificador: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo PDF');
    }
    if (!identificador) {
      throw new BadRequestException('Falta el identificador del instructor');
    }

    return this.revisionGcService.enviarGcParaRevision(file, identificador);
  }
}