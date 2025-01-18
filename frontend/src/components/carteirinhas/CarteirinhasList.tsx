// components/carteirinhas/CarteirinhasList.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CarteirinhaModal } from "./CarteirinhaModal";
import { toast } from "sonner";
import { 
  Carteirinha,
  listarCarteirinhas,
  criarCarteirinha,
  atualizarCarteirinha,
  excluirCarteirinha 
} from "@/services/carteirinhaService";

export function CarteirinhasList() {
  const [data, setData] = useState<{
    items: Carteirinha[];
    isLoading: boolean;
  }>({
    items: [],
    isLoading: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarteirinha, setSelectedCarteirinha] = useState<Carteirinha | undefined>();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await listarCarteirinhas();
        setData({
          items: response.items,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching carteirinhas:', error);
        toast.error("Erro ao carregar carteirinhas");
        setData({
          items: [],
          isLoading: false,
        });
      }
    }

    fetchData();
  }, []);

  if (data.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleSave = async (carteirinha: Partial<Carteirinha>) => {
    try {
      if (selectedCarteirinha?.id) {
        const updated = await atualizarCarteirinha(selectedCarteirinha.id, carteirinha);
        setData(prev => ({
          ...prev,
          items: prev.items.map(c => c.id === updated.id ? updated : c)
        }));
        toast.success("Carteirinha atualizada com sucesso!");
      } else {
        const created = await criarCarteirinha(carteirinha);
        setData(prev => ({
          ...prev,
          items: [...prev.items, created]
        }));
        toast.success("Carteirinha criada com sucesso!");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving carteirinha:', error);
      toast.error("Erro ao salvar carteirinha");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button onClick={() => {
          setSelectedCarteirinha(undefined);
          setIsModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Carteirinha
        </Button>
      </div>

      {data.items.length === 0 ? (
        <div className="flex justify-center items-center min-h-[100px]">
          <p className="text-sm text-muted-foreground">
            Nenhuma carteirinha encontrada
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Plano de Saúde</TableHead>
              <TableHead>Data de Validade</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((carteirinha) => (
              <TableRow key={carteirinha.id}>
                <TableCell>{carteirinha.numero}</TableCell>
                <TableCell>{carteirinha.paciente?.nome}</TableCell>
                <TableCell>{carteirinha.plano_saude?.nome}</TableCell>
                <TableCell>
                  {carteirinha.dataValidade ? 
                    format(parseISO(carteirinha.dataValidade), 'dd/MM/yyyy', { locale: ptBR }) 
                    : '-'}
                </TableCell>
                <TableCell>{carteirinha.titular ? 'Sim' : 'Não'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedCarteirinha(carteirinha);
                        setIsModalOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        try {
                          await excluirCarteirinha(carteirinha.id);
                          setData(prev => ({
                            ...prev,
                            items: prev.items.filter(c => c.id !== carteirinha.id)
                          }));
                          toast.success("Carteirinha excluída com sucesso!");
                        } catch (error) {
                          console.error('Error deleting carteirinha:', error);
                          toast.error("Erro ao excluir carteirinha");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CarteirinhaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        carteirinha={selectedCarteirinha}
      />
    </div>
  );
}