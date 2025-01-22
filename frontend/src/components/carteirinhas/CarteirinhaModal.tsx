'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Carteirinha, criarCarteirinha, atualizarCarteirinha } from "@/services/carteirinhaService";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listarPacientes } from "@/services/pacienteService";
import { listarPlanos } from "@/services/planoService";
import { Plano } from "@/types/plano";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

type CarteirinhaStatus = "ativa" | "vencida" | "cancelada" | "suspensa" | "em_analise";

interface CarteirinhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  carteirinha?: Carteirinha;
  onSuccess?: () => void;
}

interface Paciente {
  id: string;
  nome: string;
}

interface FormData extends Partial<Carteirinha> {
  status: CarteirinhaStatus;
}

export function CarteirinhaModal({
  isOpen,
  onClose,
  carteirinha,
  onSuccess,
}: CarteirinhaModalProps) {
  const [formData, setFormData] = useState<FormData>({
    numero_carteirinha: "",
    dataValidade: "",
    paciente_id: "",
    plano_saude_id: "",
    status: "ativa" as CarteirinhaStatus,
    motivo_inativacao: ""
  });
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;

      try {
        setLoading(true);
        const [pacientesResponse, planosResponse] = await Promise.all([
          listarPacientes(1, "", 100),
          listarPlanos(),
        ]);
        console.log("Pacientes carregados:", pacientesResponse.items);
        console.log("Planos carregados:", planosResponse);
        setPacientes(pacientesResponse.items || []);
        setPlanos(planosResponse || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  useEffect(() => {
    console.log("Modal aberto:", isOpen);
    console.log("Carteirinha recebida:", carteirinha);
    if (carteirinha) {
      console.log("Carteirinha para edição:", carteirinha);
      console.log("Número:", carteirinha.numero_carteirinha);
      console.log("Data Validade:", carteirinha.dataValidade);
      setFormData({
        numero_carteirinha: carteirinha.numero_carteirinha || carteirinha.numero || "",
        dataValidade: carteirinha.dataValidade || carteirinha.data_validade || "",
        paciente_id: carteirinha.paciente_id || carteirinha.paciente?.id || "",
        plano_saude_id: carteirinha.plano_saude_id || carteirinha.plano_saude?.id || "",
        status: carteirinha.status || "ativa",
        motivo_inativacao: carteirinha.motivo_inativacao || ""
      });
      console.log("FormData após atualização:", formData);
    } else {
      setFormData({
        numero_carteirinha: "",
        dataValidade: "",
        paciente_id: "",
        plano_saude_id: "",
        status: "ativa",
        motivo_inativacao: ""
      });
    }
  }, [carteirinha, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log("Dados do formulário:", formData);

      // Converte os campos para o formato do backend
      const carteirinhaData = {
        ...formData,
        data_validade: formData.dataValidade
      };

      // Remove o campo status antes de enviar
      delete carteirinhaData.status;

      console.log("Dados da carteirinha antes da conversão:", carteirinhaData);

      if (carteirinha) {
        await atualizarCarteirinha(carteirinha.id, carteirinhaData);
        toast.success("Carteirinha atualizada com sucesso!");
      } else {
        await criarCarteirinha(carteirinhaData);
        toast.success("Carteirinha criada com sucesso!");
      }

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar carteirinha:", error);
      toast.error("Erro ao salvar carteirinha");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    // Para campos de data, garantir que não tenha informação de timezone
    if (name === "dataValidade") {
      setFormData((prev) => ({
        ...prev,
        [name]: value || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (value: CarteirinhaStatus) => {
    setFormData((prev) => ({
      ...prev,
      status: value,
    }));
  };

  if (loading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {carteirinha ? "Editar Carteirinha" : "Nova Carteirinha"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paciente_id" className="text-right">
                Paciente
              </Label>
              {carteirinha ? (
                <Input
                  id="paciente"
                  value={
                    carteirinha.paciente?.nome ||
                    pacientes.find((p) => p.id === formData.paciente_id)?.nome ||
                    ""
                  }
                  disabled
                  className="col-span-3"
                />
              ) : (
                <Select
                  value={formData.paciente_id || ""}
                  onValueChange={(value) =>
                    handleSelectChange("paciente_id", value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes?.map((paciente) => (
                      <SelectItem key={paciente.id} value={paciente.id}>
                        {paciente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plano_saude_id" className="text-right">
                Plano de Saúde
              </Label>
              <Select
                value={formData.plano_saude_id || ""}
                onValueChange={(value) => handleSelectChange("plano_saude_id", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {planos
                    .filter(plano => plano.id && plano.ativo)
                    .map((plano) => (
                      <SelectItem key={plano.id} value={plano.id}>
                        {plano.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numero_carteirinha" className="text-right">
                Número
              </Label>
              <Input
                id="numero_carteirinha"
                name="numero_carteirinha"
                value={formData.numero_carteirinha}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataValidade" className="text-right">
                Data de Validade
              </Label>
              <Input
                id="dataValidade"
                name="dataValidade"
                type="date"
                value={formData.dataValidade}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="suspensa">Suspensa</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.status === "cancelada" || formData.status === "suspensa") && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="motivo_inativacao" className="text-right">
                  Motivo
                </Label>
                <Textarea
                  id="motivo_inativacao"
                  name="motivo_inativacao"
                  value={formData.motivo_inativacao}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
