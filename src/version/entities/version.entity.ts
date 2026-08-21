import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Contrato } from '../../contrato/entities/contrato.entity';

@Entity('version')
export class Version {

  @PrimaryGeneratedColumn()
  id_version: number;

  @Column('date')
  fecha: Date;

  @Column({
    type: 'simple-enum',
    enum: ['Pendiente', 'Aprobado', 'Rechazado'],
  })
  estado: string;

  @ManyToOne(() => Contrato, { eager: true })
  @JoinColumn({ name: 'id_contrato' })
  contrato: Contrato;

}