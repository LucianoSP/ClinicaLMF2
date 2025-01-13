// components/auditoria/AuditoriaHeader.tsx
import React from 'react';
import { Files, AlertCircle, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { AuditoriaResultado } from "@/types";

const formatarData = (data: string) => {
    if (!data) return '-';
    try {
        return format(new Date(data), 'dd/MM/yyyy');
    } catch {
        return data;
    }
};

export const AuditoriaHeader = () => {
    return (
        <div>
            <h1 className="page-title">
                Auditoria de Execuções
            </h1>
        </div>
    );
};