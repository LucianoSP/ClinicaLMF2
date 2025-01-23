'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Guia, GuiaFormData } from '@/services/guiaService';
import { listarPacientes } from '@/services/pacienteService';
import { listarCarteirinhas } from '@/services/carteirinhaService';
import { Paciente } from '@/types/paciente';
import { Carteirinha } from '@/services/carteirinhaService';

const guiaFormSchema = z.object({
  numero_guia: z.string().min(1, 'Número da guia é obrigatório'),
  data_emissao: z.string().optional(),
  data_validade: z.string().optional(),
  tipo: z.enum(['sp_sadt', 'consulta', 'internacao'], {
    required_error: 'Tipo é obrigatório',
  }),
  status: z.enum(['pendente', 'em_andamento', 'concluida', 'cancelada']).default('pendente'),
  paciente_carteirinha: z.string().min(1, 'Carteirinha do paciente é obrigatória'),
  paciente_nome: z.string().min(1, 'Nome do paciente é obrigatório'),
  quantidade_autorizada: z.number().min(1, 'Quantidade autorizada é obrigatória'),
  procedimento_codigo: z.string().optional(),
  procedimento_nome: z.string().optional(),
  profissional_solicitante: z.string().optional(),
  profissional_executante: z.string().optional(),
  observacoes: z.string().optional(),
});

interface GuiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GuiaFormData) => void;
  guia?: Guia;
}

export function GuiaModal({ isOpen, onClose, onSubmit, guia }: GuiaModalProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [carteirinhas, setCarteirinhas] = useState<Carteirinha[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<string>('');

  const form = useForm<GuiaFormData>({
    resolver: zodResolver(guiaFormSchema),
    defaultValues: {
      numero_guia: '',
      data_emissao: '',
      data_validade: '',
      tipo: 'sp_sadt',
      status: 'pendente',
      paciente_carteirinha: '',
      paciente_nome: '',
      quantidade_autorizada: 1,
      procedimento_codigo: '',
      procedimento_nome: '',
      profissional_solicitante: '',
      profissional_executante: '',
      observacoes: '',
    }
  });

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const response = await listarPacientes(1, '', 100);
        setPacientes(response.items);
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
      }
    };

    fetchPacientes();
  }, []);

  useEffect(() => {
    const fetchCarteirinhas = async () => {
      if (selectedPaciente) {
        try {
          const response = await listarCarteirinhas(1, 100);
          const carteirinhasDoPaciente = response.items.filter(
            c => c.paciente?.id === selectedPaciente
          );
          setCarteirinhas(carteirinhasDoPaciente);
        } catch (error) {
          console.error('Erro ao buscar carteirinhas:', error);
        }
      } else {
        setCarteirinhas([]);
      }
    };

    fetchCarteirinhas();
  }, [selectedPaciente]);

  useEffect(() => {
    if (guia) {
      form.reset({
        numero_guia: guia.numero_guia,
        data_emissao: guia.data_emissao || '',
        data_validade: guia.data_validade || '',
        tipo: guia.tipo,
        status: guia.status,
        paciente_carteirinha: guia.paciente_carteirinha,
        paciente_nome: guia.paciente_nome,
        quantidade_autorizada: guia.quantidade_autorizada,
        procedimento_codigo: guia.procedimento_codigo || '',
        procedimento_nome: guia.procedimento_nome || '',
        profissional_solicitante: guia.profissional_solicitante || '',
        profissional_executante: guia.profissional_executante || '',
        observacoes: guia.observacoes || '',
      });
    }
  }, [guia, form]);

  const handlePacienteChange = (pacienteId: string) => {
    setSelectedPaciente(pacienteId);
    const paciente = pacientes.find(p => p.id === pacienteId);
    if (paciente) {
      form.setValue('paciente_nome', paciente.nome);
    }
  };

  const handleSubmit = (data: GuiaFormData) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{guia ? 'Editar Guia' : 'Nova Guia'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="numero_guia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Guia</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sp_sadt">SP/SADT</SelectItem>
                      <SelectItem value="consulta">Consulta</SelectItem>
                      <SelectItem value="internacao">Internação</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_emissao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Emissão</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_validade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Validade</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paciente_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      handlePacienteChange(value);
                      field.onChange(pacientes.find(p => p.id === value)?.nome || '');
                    }}
                    value={selectedPaciente}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pacientes.map((paciente) => (
                        <SelectItem key={paciente.id} value={paciente.id}>
                          {paciente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paciente_carteirinha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carteirinha</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedPaciente}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a carteirinha" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {carteirinhas.map((carteirinha) => (
                        <SelectItem key={carteirinha.id} value={carteirinha.numero_carteirinha}>
                          {carteirinha.numero_carteirinha} - {carteirinha.plano_saude?.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantidade_autorizada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade Autorizada</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="procedimento_codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Procedimento</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="procedimento_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Procedimento</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profissional_solicitante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profissional Solicitante</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profissional_executante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profissional Executante</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="col-span-2 flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {guia ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
