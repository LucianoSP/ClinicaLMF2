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
import { Carteirinha, toBackendFormat } from "@/services/carteirinhaService";
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

interface CarteirinhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (carteirinha: Partial<Carteirinha>) => void;
  carteirinha?: Carteirinha;
}

interface Paciente {
  id: string;
  nome: string;
}

export function CarteirinhaModal({
  isOpen,
  onClose,
  onSave,
  carteirinha,
}: CarteirinhaModalProps) {
  const [formData, setFormData] = useState<Partial<Carteirinha>>({
    numero_carteirinha: "",
    data_validade: "",
    titular: true,
    nome_titular: "",
    paciente_id: "",
    plano_saude_id: "",
    status: "ativo"
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
    if (carteirinha) {
      console.log("Carteirinha para edição:", carteirinha);
      setFormData({
        numero_carteirinha: carteirinha.numero_carteirinha || "",
        data_validade: carteirinha.data_validade || "",
        nome_titular: carteirinha.nome_titular || "",
        titular: carteirinha.titular ?? true,
        paciente_id: carteirinha.paciente_id || carteirinha.paciente?.id || "",
        plano_saude_id: carteirinha.plano_saude_id || "",
        status: carteirinha.status ?? "ativo",
      });
    } else {
      setFormData({
        numero_carteirinha: "",
        data_validade: "",
        nome_titular: "",
        titular: true,
        paciente_id: "",
        plano_saude_id: "",
        status: "ativo",
      });
    }
  }, [carteirinha]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação dos campos obrigatórios
    if (!formData.numero_carteirinha || !formData.paciente_id || !formData.plano_saude_id) {
      console.error("Campos obrigatórios faltando:", {
        numero_carteirinha: formData.numero_carteirinha,
        paciente_id: formData.paciente_id,
        plano_saude_id: formData.plano_saude_id,
      });
      return;
    }

    const dadosParaSalvar = {
      ...formData,
    };

    console.log("Dados para salvar:", dadosParaSalvar);
    onSave(dadosParaSalvar);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    // Para campos de data, garantir que não tenha informação de timezone
    if (name === "data_validade") {
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
              <Label htmlFor="numero_carteirinha" className="text-right">
                Número*
              </Label>
              <Input
                id="numero_carteirinha"
                name="numero_carteirinha"
                value={formData.numero_carteirinha}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

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

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="data_validade" className="text-sm font-medium">
                    Data de Validade
                  </label>
                  <Input
                    id="data_validade"
                    name="data_validade"
                    type="date"
                    value={formData.data_validade || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome_titular" className="text-right">
                Nome do Titular
              </Label>
              <Input
                id="nome_titular"
                name="nome_titular"
                value={formData.nome_titular}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
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
