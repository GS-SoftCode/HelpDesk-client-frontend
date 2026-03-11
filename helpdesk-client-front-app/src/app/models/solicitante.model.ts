export class SolicitanteModel {
    codEmpresa!: number;
    codCliente!: number;
    nomSolicitante!: string;
    apeSolicitante!: string;
    emailSolicitante!: string;
    telSolicitante!: string;

    constructor(init?: Partial<SolicitanteModel>) {
        Object.assign(this, init);
    }
}