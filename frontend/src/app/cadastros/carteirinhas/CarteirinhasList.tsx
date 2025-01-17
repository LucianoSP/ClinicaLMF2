import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";
import { Carteirinha, listarCarteirinhas, excluirCarteirinha, criarCarteirinha, atualizarCarteirinha } from "@/services/carteirinhaService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CarteirinhaModal } from "./CarteirinhaModal";
import { toast } from "sonner";

export default function CarteirinhasList() {
  const [carteirinhas, setCarteirinhas] = useState<Carteirinha[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarteirinha, setSelectedCarteirinha] = useState<Carteirinha | undefined>();

  const fetchCarteirinhas = async () => {
    try {
      setLoading(true);
      const response = await listarCarteirinhas(page);
      console.log('Response:', response);
      setCarteirinhas(response.items || []);
      setTotalPages(response.pages || 0);
    } catch (error) {
      console.error('Error fetching carteirinhas:', error);
      setCarteirinhas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarteirinhas();
  }, [page]);

  const handleEdit = (carteirinha: Carteirinha) => {
    setSelectedCarteirinha(carteirinha);
    setIsModalOpen(true);
  };

  const handleDelete = async (carteirinha: Carteirinha) => {
    if (!carteirinha.id) return;
    
    try {
      await excluirCarteirinha(carteirinha.id);
      await fetchCarteirinhas();
      toast.success("Carteirinha excluída com sucesso!");
    } catch (error) {
      console.error('Error deleting carteirinha:', error);
      toast.error("Erro ao excluir carteirinha");
    }
  };

  const handleSave = async (carteirinha: Partial<Carteirinha>) => {
    try {
      if (selectedCarteirinha?.id) {
        await atualizarCarteirinha(selectedCarteirinha.id, carteirinha as Carteirinha);
        toast.success("Carteirinha atualizada com sucesso!");
      } else {
        await criarCarteirinha(carteirinha as Carteirinha);
        toast.success("Carteirinha criada com sucesso!");
      }
      setIsModalOpen(false);
      fetchCarteirinhas();
    } catch (error) {
      console.error('Error saving carteirinha:', error);
      toast.error("Erro ao salvar carteirinha");
    }
  };

  const handleNewCarteirinha = () => {
    setSelectedCarteirinha(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Carteirinhas</h2>
        <Button onClick={handleNewCarteirinha}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nova Carteirinha
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número da Carteirinha</TableHead>
                <TableHead>Data de Validade</TableHead>
                <TableHead>Nome do Titular</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Plano de Saúde</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carteirinhas?.map((carteirinha) => (
                <TableRow key={carteirinha.id}>
                  <TableCell>{carteirinha.numero || '-'}</TableCell>
                  <TableCell>
                    {carteirinha.dataValidade ? 
                      format(new Date(carteirinha.dataValidade), 'dd/MM/yyyy', { locale: ptBR }) 
                      : '-'}
                  </TableCell>
                  <TableCell>{carteirinha.nomeTitular || '-'}</TableCell>
                  <TableCell>{carteirinha.paciente?.nome || '-'}</TableCell>
                  <TableCell>{carteirinha.plano_saude?.nome || '-'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(carteirinha)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(carteirinha)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CarteirinhaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        carteirinha={selectedCarteirinha}
      />
    </div>
  );
}