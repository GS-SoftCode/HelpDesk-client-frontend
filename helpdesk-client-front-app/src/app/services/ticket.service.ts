import { Injectable } from '@angular/core';
import { env } from '../enviroments/enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SolicitanteModel } from '../models/solicitante.model';
import { TicketModel } from '../models/ticket.model';
import { SolTickModel } from '../models/sol-tick.model';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  constructor(private http: HttpClient) { }

  crearTicketSolicitante(solicitante: SolicitanteModel): Observable<any> {
    return this.http.post(`${env.apiUrl}/tickets/solicitante`, solicitante);
  }

  crearTicket(ticket: TicketModel): Observable<any> {
    return this.http.post(`${env.apiUrl}/tickets/crearTicket`, ticket);
  }

  createEnviarEmail(soltick: SolTickModel): Observable<any> {
    return this.http.post(`${env.apiUrl}/tickets/mailTicket`, soltick);
  }
}