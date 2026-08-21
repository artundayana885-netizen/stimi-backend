export class CreatePersonaDto {
  nombre: string;
  identificacion: string;
  correo: string;
  telefono: string;
  id_area: number; // o el campo que uses para asignar el área
}