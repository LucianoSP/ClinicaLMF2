'use client';

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Paciente } from "@/types/paciente";
import { criarPaciente, atualizarPaciente } from "@/services/pacienteService";
import { useToast } from "@/components/ui/use-toast";

interface PacienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: Paciente | null;
  onSuccess: () => void;
}

export function PacienteDialog({ open, onOpenChange, paciente, onSuccess }: PacienteDialogProps) {
  const { toast } = useToast();
  const form = useForm<Paciente>({
    defaultValues: {
      nome: "",
      nome_responsavel: "",
      data_nascimento: "",
      cpf: "",
      telefone: "",
      email: "",
    },
  });

  useEffect(() => {
    if (paciente) {
      form.reset(paciente);
    } else {
      form.reset({
        nome: "",
        nome_responsavel: "",
        data_nascimento: "",
        cpf: "",
        telefone: "",
        email: "",
      });
    }
  }, [paciente, form]);

  const onSubmit = async (data: Paciente) => {
    try {
      // Ajusta a data para o formato correto
      const dadosAjustados = {
        ...data,
        data_nascimento: data.data_nascimento ? data.data_nascimento.split('T')[0] : null
      };

      if (paciente?.id) {
        await atualizarPaciente(paciente.id, dadosAjustados);
        toast({
          title: "Sucesso",
          description: "Paciente atualizado com sucesso",
        });
      } else {
        await criarPaciente(dadosAjustados);
        toast({
          title: "Sucesso",
          description: "Paciente criado com sucesso",
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar paciente",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{paciente ? "Editar" : "Novo"} Paciente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              rules={{ required: "Nome é obrigatório" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nome_responsavel"
              rules={{ required: "Nome do responsável é obrigatório" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Responsável</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_nascimento"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      value={value ? value.split('T')[0] : ''} 
                      onChange={(e) => {
                        const newValue = e.target.value;
                        onChange(newValue ? newValue.split('T')[0] : '');
                      }}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={11} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
