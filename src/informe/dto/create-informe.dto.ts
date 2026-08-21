import { IsString, IsNotEmpty, MaxLength, IsInt, IsOptional } from 'class-validator';

export class CreateInformeDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tipologia: string;

  @IsInt()
  @IsNotEmpty()
  id_version: number;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  instructor?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  observacion?: string;

  @IsString()
  @IsOptional()
  tipo_notificacion?: string;
}