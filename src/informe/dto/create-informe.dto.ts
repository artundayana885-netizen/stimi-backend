import { IsString, IsNotEmpty, MaxLength, IsInt, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInformeDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tipologia: string;

  // @Type(() => Number) convierte explícitamente este campo a número.
  // Antes se dependía de `enableImplicitConversion` global en el
  // ValidationPipe para esto, pero esa opción, al aplicarse a TODOS los
  // campos, corrompía `marcas` (lo convertía en un arreglo vacío anidado
  // en vez de dejar los objetos reales) porque `marcas` es un arreglo de
  // forma libre sin una clase/tipo fijo que class-transformer pueda
  // reconstruir. Con `@Type()` puesto solo aquí, `id_version` se sigue
  // convirtiendo bien (llega como texto "1" en las subidas con archivo
  // adjunto) sin tocar el comportamiento de ningún otro campo.
  @Type(() => Number)
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
  // A propósito SIN @Type() ni conversión automática: son datos ya
  // correctamente tipados desde el frontend (nunca llegan como texto,
  // porque este campo solo viaja en peticiones JSON, nunca en
  // multipart/form-data), así que no necesitan ni deben transformarse.
  @IsArray()
  @IsOptional()
  marcas?: any[];
}