import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Area } from '../../area/entities/area.entity';

@Entity('persona')
export class Persona {
  @PrimaryGeneratedColumn()
  id_persona: number;

  @Column('varchar', { length: 100 })
  nombre: string;

  @Column('varchar', { length: 20, unique: true })
  identificacion: string;

  @Column('varchar', { length: 50, unique: true })
  correo: string;

  @Column('varchar', { length: 15 })
  telefono: string;

  @ManyToOne(() => Area, { eager: true })
  @JoinColumn({ name: 'id_area' })
  area: Area;

  // OJO: se elimina el campo "credencial" -> ManyToOne(Rol).
  // El rol/login ahora vive en la entidad Usuario (usuario.entity.ts),
  // que apunta a Persona (1:1) y a Rol por separado.
}