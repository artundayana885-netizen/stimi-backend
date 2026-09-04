import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Informe } from './entities/informe.entity';
import { Version } from '../version/entities/version.entity';
import { CreateInformeDto } from './dto/create-informe.dto';
import { UpdateInformeDto } from './dto/update-informe.dto';

@Injectable()
export class InformeService {

  constructor(
    @InjectRepository(Informe)
    private readonly informeRepository: Repository<Informe>,
    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
  ) {}

  async create(
    createInformeDto: CreateInformeDto,
    archivo?: Express.Multer.File,
  ): Promise<Informe> {
    const idVersion = createInformeDto.id_version || 1;

    let version = await this.versionRepository.findOne({ where: { id_version: idVersion } });
    if (!version) {
      version = this.versionRepository.create({
        id_version: idVersion,
        fecha: new Date(),
        estado: 'Aprobado'
      });
      version = await this.versionRepository.save(version);
    }

    const { id_version, ...rest } = createInformeDto;
    const informe = this.informeRepository.create({
      ...rest,
      // Si llegó un archivo real, su nombre original manda sobre el
      // `fileName` que haya mandado el frontend en el body.
      fileName: archivo?.originalname || createInformeDto.fileName,
      archivoPath: archivo?.path,
      archivoMimeType: archivo?.mimetype,
      version: { id_version: version.id_version },
    });
    return await this.informeRepository.save(informe);
  }

  async findAll(): Promise<Informe[]> {
    return await this.informeRepository.find();
  }

  async findOne(id: number): Promise<Informe> {
    const informe = await this.informeRepository.findOne({ where: { id_informe: id } });
    if (!informe) throw new NotFoundException(`Informe con id ${id} no encontrado`);
    return informe;
  }

  async update(id: number, updateInformeDto: UpdateInformeDto): Promise<Informe> {
    await this.findOne(id);

    let versionId = updateInformeDto.id_version;
    if (versionId) {
      let version = await this.versionRepository.findOne({ where: { id_version: versionId } });
      if (!version) {
        version = this.versionRepository.create({
          id_version: versionId,
          fecha: new Date(),
          estado: 'Aprobado'
        });
        await this.versionRepository.save(version);
      }
    }

    const { id_version, ...rest } = updateInformeDto;

    try {
      await this.informeRepository.update(id, {
        ...rest,
        ...(versionId && { version: { id_version: versionId } }),
      });
    } catch (error: any) {
      // Antes este error se perdía y NestJS respondía un genérico
      // "Internal server error" sin ninguna pista de la causa real
      // (ej. columna "marcas" inexistente en la base de datos porque el
      // backend desplegado no se reinició/sincronizó después de agregar
      // esa columna a la entidad). Ahora se registra en consola Y se
      // reenvía el mensaje real del driver de la base de datos, para que
      // el error que ve el frontend ("Error al solicitar corrección: ...")
      // diga exactamente qué falló.
      console.error('[InformeService.update] Error al actualizar informe', id, error);
      throw new InternalServerErrorException(
        `No se pudo actualizar el informe: ${error.message}`,
      );
    }

    return this.findOne(id);
  }

  // Agrega imágenes de evidencia al informe (hasta 5 en total, contando
  // las que ya tuviera). Mismo patrón que `create()` usa para
  // archivoPath/archivoMimeType, pero acumulando en un arreglo en vez de
  // sobreescribir un solo valor.
  async agregarImagenesObservacion(
    id: number,
    imagenes: Express.Multer.File[],
  ): Promise<Informe> {
    const informe = await this.findOne(id); // 404 si el informe no existe
    const existentes = informe.imagenesObservacion || [];
    const nuevas = imagenes.map((img) => ({
      path: img.path,
      mimeType: img.mimetype,
      originalName: img.originalname,
    }));
    // Límite duro de 5 también aquí, por si llegan varias peticiones
    // sueltas en vez de una sola con todos los archivos.
    const combinadas = [...existentes, ...nuevas].slice(0, 5);
    await this.informeRepository.update(id, { imagenesObservacion: combinadas });
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.informeRepository.delete(id);
    return { message: `Informe con id ${id} eliminado correctamente` };
  }

}