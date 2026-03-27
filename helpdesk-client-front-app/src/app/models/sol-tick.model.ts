import { SolicitanteModel } from "./solicitante.model";
import { TicketModel } from "./ticket.model";

export class SolTickModel {
    solicitante!: SolicitanteModel;
    ticket!: TicketModel;
    img1?: string; // Base64
    img2?: string; // Base64
}