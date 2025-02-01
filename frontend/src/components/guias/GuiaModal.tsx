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
import { Guia, GuiaFormData, guiaSchema } from '@/services/guiaService';
import { Paciente } from '@/types/paciente';
import { Procedimento } from '@/types/procedimento';
import { Carteirinha, listarCarteirinhasPorPaciente } from '@/services/carteirinhaService';
import { listarPacientes } from '@/services/pacienteService';
import { listarProcedimentos } from '@/services/procedimentoService';
import { toast } from '@/components/ui/use-toast';

const guiaFormSchema = guiaSchema;

interface GuiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GuiaFormData) => void;
  guia?: Guia;
}

export function GuiaModal({ isOpen, onClose, onSubmit, guia }: GuiaModalProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [carteirinhas, setCarteirinhas] = useState<Carteirinha[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);

  const form = useForm<GuiaFormData>({
    resolver: zodResolver(guiaFormSchema),
    defaultValues: {
      numero_guia: '',
      data_emissao: '',
      data_validade: '',
      tipo: 'sp_sadt',
      status: 'pendente',
      paciente_id: '',
      carteirinha_id: '',
      procedimento_id: '',
      quantidade_autorizada: 1,
      profissional_solicitante: '',
      profissional_executante: '',
      observacoes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [pacientesData, procedimentosData] = await Promise.all([
            listarPacientes(),
            listarProcedimentos()
          ]);
          setPacientes(pacientesData.items || []);
          setProcedimentos(procedimentosData || []);
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Erro ao carregar dados"
          });
        }
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    const pacienteId = form.getValues('paciente_id');
    if (pacienteId) {
      const fetchCarteirinhas = async () => {
        try {
          const data = await listarCarteirinhasPorPaciente(pacienteId);
          setCarteirinhas(data || []);
        } catch (error) {
          console.error('Erro ao carregar carteirinhas:', error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Erro ao carregar carteirinhas"
          });
        }
      };
      fetchCarteirinhas();
    } else {
      setCarteirinhas([]);
    }
  }, [form.watch('paciente_id')]);

  useEffect(() => {
    if (guia) {
      form.reset({
        numero_guia: guia.numero_guia,
        data_emissao: guia.data_emissao || '',
        data_validade: guia.data_validade || '',
        tipo: guia.tipo,
        status: guia.status,
        paciente_id: guia.paciente_id,
        carteirinha_id: guia.carteirinha_id,
        procedimento_id: guia.procedimento_id,
        quantidade_autorizada: guia.quantidade_autorizada,
        profissional_solicitante: guia.profissional_solicitante || '',
        profissional_executante: guia.profissional_executante || '',
        observacoes: guia.observacoes || '',
      });
    }
  }, [guia, form]);

  const handleSubmit = async (data: GuiaFormData) => {
    try {
      await onSubmit(data);
      form.reset();
      onClose();
      toast({
        title: guia ? "Guia atualizada" : "Guia criada",
        description: guia ? "Guia atualizada com sucesso!" : "Guia criada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao salvar guia:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar guia"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{guia ? 'Editar Guia' : 'Nova Guia'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                name="paciente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                name="carteirinha_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carteirinha</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!form.getValues('paciente_id')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a carteirinha" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {carteirinhas.map((carteirinha) => (
                          <SelectItem key={carteirinha.id} value={carteirinha.id}>
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
                name="procedimento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedimento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o procedimento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {procedimentos.map((procedimento) => (
                          <SelectItem key={procedimento.id} value={procedimento.id}>
                            {procedimento.codigo} - {procedimento.nome}
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
                      <Input type="number" min={1} {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {guia ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
