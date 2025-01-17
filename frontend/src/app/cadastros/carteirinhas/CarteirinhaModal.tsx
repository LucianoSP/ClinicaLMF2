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
import { Carteirinha } from "@/services/carteirinhaService";
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

interface Plano {
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
    numero: "",
    dataValidade: "",
    nomeTitular: "",
    titular: true,
    pacienteId: "",
    planoId: "",
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
          listarPacientes(1, 100),
          listarPlanos(),
        ]);
        console.log('Pacientes carregados:', pacientesResponse.items);
        console.log('Planos carregados:', planosResponse);
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
      console.log('Carteirinha para edição:', carteirinha);
      setFormData({
        ...carteirinha,
        dataValidade: carteirinha.dataValidade?.split('T')[0] || "",
        pacienteId: carteirinha.pacienteId || carteirinha.paciente?.id || "",
      });
    } else {
      setFormData({
        numero: "",
        dataValidade: "",
        nomeTitular: "",
        titular: true,
        pacienteId: "",
        planoId: "",
      });
    }
  }, [carteirinha]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Garantir que a data está no formato correto antes de enviar
    const dadosParaSalvar = {
      ...formData,
      dataValidade: formData.dataValidade ? formData.dataValidade.split('T')[0] : null
    };
    console.log('Dados sendo enviados:', dadosParaSalvar);
    onSave(dadosParaSalvar);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Para campos de data, garantir que não tenha informação de timezone
    if (name === 'dataValidade') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? value.split('T')[0] : ''
      }));
    } else {
      setFormData(prev => ({
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
              <Label htmlFor="numero" className="text-right">
                Número
              </Label>
              <Input
                id="numero"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pacienteId" className="text-right">
                Paciente
              </Label>
              {carteirinha ? (
                <Input
                  id="paciente"
                  value={carteirinha.paciente?.nome || pacientes.find(p => p.id === formData.pacienteId)?.nome || ''}
                  disabled
                  className="col-span-3"
                />
              ) : (
                <Select
                  value={formData.pacienteId || ""}
                  onValueChange={(value) => handleSelectChange("pacienteId", value)}
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
              <Label htmlFor="planoId" className="text-right">
                Plano de Saúde
              </Label>
              <Select
                value={formData.planoId || ""}
                onValueChange={(value) => handleSelectChange("planoId", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {planos?.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nomeTitular" className="text-right">
                Nome do Titular
              </Label>
              <Input
                id="nomeTitular"
                name="nomeTitular"
                value={formData.nomeTitular}
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
