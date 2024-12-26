export interface AuditoriaResultado {
    total_protocolos: number;
    total_divergencias: number;
    data_inicial: string;
    data_final: string;
    divergencias_por_tipo: {
        [key: string]: number;
    };
    status_divergencias: {
        [key: string]: number;
    };
}
