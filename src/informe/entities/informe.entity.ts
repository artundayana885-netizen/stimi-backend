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

  // Ruta en disco (relativa a la raíz del backend) donde quedó guardado el
  // archivo real que subió el instructor. Nula para informes antiguos que
  // se crearon antes de que existiera la carga de archivos.
  @Column('varchar', { length: 500, nullable: true })
  archivoPath: string;

  // Mime type del archivo subido (ej. 'application/pdf'), para servirlo
  // con el Content-Type correcto al descargarlo.
  @Column('varchar', { length: 150, nullable: true })
  archivoMimeType: string;
}