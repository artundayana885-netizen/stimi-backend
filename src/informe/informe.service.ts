import { Injectable, NotFoundException } from '@nestjs/common';
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
    await this.informeRepository.update(id, {
      ...rest,
      ...(versionId && { version: { id_version: versionId } }),
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.informeRepository.delete(id);
    return { message: `Informe con id ${id} eliminado correctamente` };
  }

}