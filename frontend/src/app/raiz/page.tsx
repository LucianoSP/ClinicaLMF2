'use client';
import { useEffect, useState } from 'react';

export default function RaizPage() {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(process.env.NEXT_PUBLIC_API_URL || '', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'omit',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                setData(result);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Erro ao buscar dados');
                console.error('Erro:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Teste de Conexão com Backend</h1>

            {loading && <p>Carregando...</p>}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p>Erro: {error}</p>
                </div>
            )}

            {data && (
                <div className="bg-white shadow rounded p-4">
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}