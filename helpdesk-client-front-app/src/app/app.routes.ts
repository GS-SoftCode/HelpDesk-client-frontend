import { Routes } from '@angular/router';
import { SolicitudForm } from './pages/solicitud-form/solicitud-form';

export const routes: Routes = [
    {path: '', redirectTo: '/solicitud', pathMatch: 'full'},
    {path: 'solicitud', component: SolicitudForm},
];