import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import all entities explicitly to bypass Windows path globbing issues in folders with special characters (like parentheses)
import { Actividad } from './actividad/entities/actividad.entity';
import { Area } from './area/entities/area.entity';
import { CentroFormacion } from './centro-formacion/entities/centro-formacion.entity';
import { Contrato } from './contrato/entities/contrato.entity';
import { Evidencias } from './evidencias/entities/evidencia.entity';
import { Informe } from './informe/entities/informe.entity';
import { InformeGc } from './informe_gc/entities/informe_gc.entity';
import { InformeGf } from './informe_gf/entities/informe_gf.entity';
import { InformeObligacion } from './informe_obligacion/entities/informe-obligacion.entity';
import { Notificacion } from './notificacion/entities/notificacion.entity';
import { Novedad } from './novedad/entities/novedad.entity';
import { Obligaciones } from './obligaciones/entities/obligaciones.entity';
import { Persona } from './persona/entities/persona.entity';
import { Rol } from './rol/entities/rol.entity';
import { Sede } from './sede/entities/sede.entity';
import { Usuario } from './usuario/entities/usuario.entity';
import { Version } from './version/entities/version.entity';

import { AreaModule } from './area/area.module';
import { RolModule } from './rol/rol.module';
import { PersonaModule } from './persona/persona.module';
import { ContratoModule } from './contrato/contrato.module';
import { ObligacionesModule } from './obligaciones/obligaciones.module';
import { VersionModule } from './version/version.module';
import { InformeModule } from './informe/informe.module';
import { InformeGcModule } from './informe_gc/informe_gc.module';
import { InformeGfModule } from './informe_gf/informe_gf.module';
import { ActividadModule } from './actividad/actividad.module';
import { EvidenciasModule } from './evidencias/evidencias.module';
import { NovedadModule } from './novedad/novedad.module';
import { InformeObligacionModule } from './informe_obligacion/informe-obligacion.module';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbType = configService.get<string>('DB_TYPE') || 'sqlite';
        const entities = [
          Actividad,
          Area,
          CentroFormacion,
          Contrato,
          Evidencias,
          Informe,
          InformeGc,
          InformeGf,
          InformeObligacion,
          Notificacion,
          Novedad,
          Obligaciones,
          Persona,
          Rol,
          Sede,
          Usuario,
          Version,
        ];

        if (dbType === 'sqlite') {
          return {
            type: 'better-sqlite3',
            database: configService.get<string>('DB_DATABASE') || 'database.sqlite',
            entities,
            synchronize: true,
          } as any;
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          entities,
          synchronize: true,
        } as any;
      },
    }),
    AreaModule,
    RolModule,
    PersonaModule,
    ContratoModule,
    ObligacionesModule,
    VersionModule,
    InformeModule,
    InformeGcModule,
    InformeGfModule,
    ActividadModule,
    EvidenciasModule,
    NovedadModule,
    InformeObligacionModule,
    UsuarioModule,
  ],
})
export class AppModule {}
