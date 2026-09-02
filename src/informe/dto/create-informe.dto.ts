import { IsString, IsNotEmpty, MaxLength, IsInt, IsOptional, IsArray } from 'class-validator';

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

  // Marcas (resaltados/tachones/comentarios) hechas sobre el documento al
  // revisar. Array de objetos libres (page, type, x, y, w, h, note, id).
  @IsArray()
  @IsOptional()
  marcas?: any[];
}