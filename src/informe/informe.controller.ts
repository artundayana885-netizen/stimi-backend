import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import type { Response } from 'express';
import { InformeService } from './informe.service';
import { CreateInformeDto } from './dto/create-informe.dto';
import { UpdateInformeDto } from './dto/update-informe.dto';

// Carpeta donde quedan guardados en disco los informes que suben los
// instructores. Relativa a la raíz del backend (desde donde se ejecuta
// `nest start` / `node dist/main`).
const INFORMES_UPLOAD_DIR = join(process.cwd(), 'uploads', 'informes');

@Controller('informe')
export class InformeController {
  constructor(private readonly informeService: InformeService) {}

  // El frontend envía multipart/form-data con el archivo en el campo
  // "archivo" además de los campos normales del informe (tipologia,
  // instructor, date, etc.), así que create() ahora acepta ambos.
  @Post()
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: INFORMES_UPLOAD_DIR,
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB, igual que el límite anunciado en el frontend
    }),
  )
  create(
    @Body() createInformeDto: CreateInformeDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.informeService.create(createInformeDto, archivo);
  }

  @Get()
  findAll() {
    return this.informeService.findAll();
  }

  // Descarga el archivo REAL que subió el instructor al crear el informe
  // (no una recreación). Si el informe no tiene archivo guardado (por
  // ejemplo, informes creados antes de esta funcionalidad), responde 404
  // para que el frontend pueda hacer un respaldo si quiere.
  @Get(':id/archivo')
  async descargarArchivo(@Param('id') id: string, @Res() res: Response) {
    const informe = await this.informeService.findOne(+id);
    if (!informe.archivoPath || !existsSync(informe.archivoPath)) {
      throw new NotFoundException('Este informe no tiene un archivo original cargado');
    }
    const nombreDescarga = informe.fileName || `informe${extname(informe.archivoPath)}`;
    if (informe.archivoMimeType) {
      res.type(informe.archivoMimeType);
    }
    return res.download(informe.archivoPath, nombreDescarga);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.informeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInformeDto: UpdateInformeDto) {
    return this.informeService.update(+id, updateInformeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.informeService.remove(+id);
  }
}