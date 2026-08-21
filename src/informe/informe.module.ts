import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InformeService } from './informe.service';
import { InformeController } from './informe.controller';
import { Informe } from './entities/informe.entity';
import { Version } from '../version/entities/version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Informe, Version])],
  controllers: [InformeController],
  providers: [InformeService],
  exports: [TypeOrmModule],
})
export class InformeModule {}