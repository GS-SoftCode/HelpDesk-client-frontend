import { Injectable } from '@angular/core';
import { env } from '../enviroments/enviroment';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ClienteModel } from '../models/cliente.model';

@Injectable({
	providedIn: 'root',
})
export class ClienteService {
	constructor(private http: HttpClient) { }

	getAll(): Observable<ClienteModel[]> {
		return this.http.get<any[]>(`${env.apiUrl}/clientes`).pipe(
			map((rows) =>
				rows
					.filter((e) => e.stsCliente === 'A')
					.map((e) => ({
						codCliente: e.codCliente,
						codEmpresa: e.codEmpresa,
						nomClienteRep: e.nomClienteRep,
						stsCliente: e.stsCliente,
						numId: e.numId,
					}))
			)
		);
	}
}
