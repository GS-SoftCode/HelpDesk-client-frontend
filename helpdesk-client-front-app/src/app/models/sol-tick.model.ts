import { SolicitanteModel } from "./solicitante.model";
import { TicketModel } from "./ticket.model";

export class SolTickModel {
    solicitante!: SolicitanteModel;
    ticket!: TicketModel;
    
    //Campos para imágenes
    img1?: string;
    img2?: string;
}