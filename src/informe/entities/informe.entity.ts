import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Version } from '../../version/entities/version.entity';

@Entity('informe')
export class Informe {

  @PrimaryGeneratedColumn()
  id_informe: number;

  @Column('varchar', {
    length: 100,
  })
  tipologia: string;

  @ManyToOne(
    () => Version,
    { eager: true },
  )
  @JoinColumn({ name: 'id_version' })
  version: Version;

  @Column('varchar', { length: 255, nullable: true })
  fileName: string;

  @Column('varchar', { length: 50, default: 'Pendiente' })
  status: string;

  @Column('varchar', { length: 150, nullable: true })
  instructor: string;

  @Column('varchar', { length: 50, nullable: true })
  date: string;

  @Column('text', { nullable: true })
  observacion: string;

  @Column('varchar', { length: 50, nullable: true })
  tipo_notificacion: string;
}