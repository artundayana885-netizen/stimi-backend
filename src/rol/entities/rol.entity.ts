import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rol')
export class Rol {
  @PrimaryGeneratedColumn()
  id_rol: number;

  @Column('varchar', { length: 50, unique: true })
  nombre_rol: string; // 'Instructor' | 'Coordinador'
}