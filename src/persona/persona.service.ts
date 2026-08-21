import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from './entities/persona.entity';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonaService {

  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) {}

  async create(createPersonaDto: CreatePersonaDto): Promise<Persona> {
    const persona = this.personaRepository.create({
  ...createPersonaDto,
});
return await this.personaRepository.save(persona);
  }

  async findAll(): Promise<Persona[]> {
    return await this.personaRepository.find();
  }

  async findOne(id: number): Promise<Persona> {
    const persona = await this.personaRepository.findOne({ where: { id_persona: id } });
    if (!persona) throw new NotFoundException(`Persona con id ${id} no encontrada`);
    return persona;
  }

async update(id: number, updatePersonaDto: UpdatePersonaDto) {
  await this.personaRepository.update(id, {
    ...updatePersonaDto,
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.personaRepository.delete(id);
    return { message: `Persona con id ${id} eliminada correctamente` };
  }

}