// components/auditoria/AuditoriaHeader.tsx
export const AuditoriaHeader = () => {
    return (
        <div className="flex justify-between items-center p-6 border-b">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-semibold text-[#6b342f]">
                    Auditoria de Execuções
                </h1>
            </div>
        </div>
    );
};

// components/auditoria/EstatisticasCards.tsx
export const EstatisticasCards = ({ resultadoAuditoria }: { resultadoAuditoria: AuditoriaResultado }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                title="Total de Protocolos"
                value={resultadoAuditoria.total_protocolos}
                icon={<FileText className="w-6 h-6" />}
            />
            <StatCard
                title="Divergências Encontradas"
                value={resultadoAuditoria.total_divergencias}
                icon={<AlertCircle className="w-6 h-6" />}
                variant="warning"
            />
            <StatCard
                title="Período Inicial"
                value={formatarData(resultadoAuditoria.data_inicial)}
                icon={<Calendar className="w-6 h-6" />}
            />
            <StatCard
                title="Período Final"
                value={formatarData(resultadoAuditoria.data_final)}
                icon={<Calendar className="w-6 h-6" />}
            />
        </div>
    );
};

// components/auditoria/FiltrosAuditoria.tsx
export const FiltrosAuditoria = ({
    dataInicial,
    setDataInicial,
    dataFinal,
    setDataFinal,
    statusFiltro,
    setStatusFiltro,
    tipoDivergencia,
    setTipoDivergencia,
}) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DatePicker
                    label="Data Inicial"
                    date={dataInicial}
                    setDate={setDataInicial}
                />
                <DatePicker
                    label="Data Final"
                    date={dataFinal}
                    setDate={setDataFinal}
                />
                <Select
                    label="Status"
                    value={statusFiltro}
                    onChange={(e) => setStatusFiltro(e.target.value)}
                    options={[
                        { value: 'todos', label: 'Todos' },
                        { value: 'pendente', label: 'Pendentes' },
                        { value: 'resolvida', label: 'Resolvidas' },
                    ]}
                />
                <Select
                    label="Tipo de Divergência"
                    value={tipoDivergencia}
                    onChange={(e) => setTipoDivergencia(e.target.value)}
                    options={[
                        { value: 'todos', label: 'Todos' },
                        { value: 'data', label: 'Datas' },
                        { value: 'documentacao', label: 'Documentação' },
                        { value: 'quantidade', label: 'Quantitativas' },
                    ]}
                />
            </div>
        </div>
    );
};