import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Persona } from '../persona/entities/persona.entity';
import { Area } from '../area/entities/area.entity';
import { Rol } from '../rol/entities/rol.entity';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Persona, Area, Rol]),
  ],
  providers: [UsuarioService],
  controllers: [UsuarioController],
  exports: [UsuarioService],
})
export class UsuarioModule {}
