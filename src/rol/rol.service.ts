import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async create(createRolDto: CreateRolDto) {
    const rol = this.rolRepository.create(createRolDto);
    return await this.rolRepository.save(rol);
  }

  async findAll() {
    return await this.rolRepository.find();
  }

  async findOne(id: number) {
    return await this.rolRepository.findOne({ where: { id_rol: id } });
  }

  async update(id: number, updateRolDto: UpdateRolDto) {
    await this.rolRepository.update(id, updateRolDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const rol = await this.findOne(id);
    await this.rolRepository.delete(id);
    return rol;
  }
}