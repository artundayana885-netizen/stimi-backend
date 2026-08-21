import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('centro_formacion')
export class CentroFormacion {
  @PrimaryGeneratedColumn()
  id_centro: number;

  @Column('varchar', { length: 150 })
  nombre_centro: string;
}