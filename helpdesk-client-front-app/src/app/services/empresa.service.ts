import { Injectable } from '@angular/core';
import { env } from '../enviroments/enviroment';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { EmpresaModel } from '../models/empresa.model';

@Injectable({
  providedIn: 'root',
})
export class EmpresaService {
  constructor(private http: HttpClient) { }

  getAll(): Observable<EmpresaModel[]> {
    return this.http.get<any[]>(`${env.apiUrl}/empresas`).pipe(
      map((rows) =>
        rows.map((e) => ({
          codEmpresa: e.codEmpresa,
          nomEmpresa: e.nomEmpresa,
          nomRuc: e.nomRuc,
        }))
      )
    );
  }
}