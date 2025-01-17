'use client';

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Carteirinha {
  id: string;
  numero: string;
  dataValidade: string;
  titular: boolean;
  nomeTitular?: string;
  planoId: string;
  planoNome: string;
}

interface CarteirinhaError {
  message: string;
  code?: string;
}

interface CarteirinhasListProps {
  carteirinhas: Carteirinha[];
  onEdit: (carteirinha: Carteirinha) => void;
  isLoading?: boolean;
  error?: CarteirinhaError;
}

export function CarteirinhasList({ carteirinhas, onEdit, isLoading, error }: CarteirinhasListProps) {
  if (isLoading) {
    return (
      <div className="flex h-[150px] w-full items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">
          Carregando carteirinhas...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[150px] w-full items-center justify-center rounded-md border border-dashed border-destructive">
        <p className="text-sm text-destructive">
          Erro ao carregar carteirinhas: {error.message}
        </p>
      </div>
    );
  }

  if (carteirinhas.length === 0) {
    return (
      <div className="flex h-[150px] w-full items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">
          Nenhuma carteirinha cadastrada. Clique em "Nova Carteirinha" para adicionar.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Titular</TableHead>
            <TableHead>Nome do Titular</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {carteirinhas.map((carteirinha) => (
            <TableRow key={carteirinha.id}>
              <TableCell>{carteirinha.numero}</TableCell>
              <TableCell>
                {new Date(carteirinha.dataValidade).toLocaleDateString()}
              </TableCell>
              <TableCell>{carteirinha.planoNome}</TableCell>
              <TableCell>{carteirinha.titular ? "Sim" : "Não"}</TableCell>
              <TableCell>
                {carteirinha.titular ? "-" : carteirinha.nomeTitular}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(carteirinha)}
                >
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}