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

  // Marcas (resaltados / tachones / comentarios) que el coordinador dejó
  // sobre el documento al pedir una corrección. Se guardan como JSON para
  // que el instructor las vea superpuestas en el mismo lugar exacto donde
  // el coordinador las dejó. 'simple-json' serializa/parsea automáticamente
  // (funciona igual en sqlite y en postgres, sin tocar el tipo de columna).
  @Column('simple-json', { nullable: true })
  marcas: any[];

  // Ruta en disco de la imagen de evidencia que el coordinador adjunta al
  // aprobar/corregir un informe (ej. un pantallazo). Mismo patrón que
  // archivoPath, pero en un archivo aparte porque es opcional y llega en
  // una petición distinta (imagen-observacion), no al crear el informe.
  @Column('varchar', { length: 500, nullable: true })
  imagenObservacionPath: string;

  // Mime type de la imagen de observación, para servirla con el
  // Content-Type correcto al descargarla.
  @Column('varchar', { length: 150, nullable: true })
  imagenObservacionMimeType: string;
}