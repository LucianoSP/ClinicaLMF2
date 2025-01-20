'use client';

import {
  criarCarteirinha,
  atualizarCarteirinha,
  type Carteirinha,
} from "@/services/carteirinhaService";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  numero: z.string().min(1, "Número da carteirinha é obrigatório"),
  dataValidade: z.string()
    .min(1, "Data de validade é obrigatória")
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Data deve estar no formato YYYY-MM-DD"
    ),
  titular: z.boolean().default(false),
  nomeTitular: z.string().optional(),
  planoSaudeId: z.string().min(1, "Plano de saúde é obrigatório"),
  pacienteId: z.string().min(1, "Paciente é obrigatório"),
});

type CarteirinhaFormValues = z.infer<typeof formSchema>;

interface CarteirinhaFormProps {
  carteirinha?: {
    id: string;
    numero: string;
    dataValidade: string;
    titular: boolean;
    nomeTitular?: string;
    planoSaudeId: string;
    pacienteId: string;
    plano_saude?: {
      id: string;
      nome: string;
      codigo: string;
    };
  } | null;
  planos: Array<{ id: string; nome: string }>;
  pacientes: Array<{ id: string; nome: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CarteirinhaForm({
  carteirinha,
  planos,
  pacientes,
  open,
  onOpenChange,
  onSuccess,
}: CarteirinhaFormProps) {
  const { toast } = useToast();
  const form = useForm<CarteirinhaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero: "",
      dataValidade: "",
      titular: false,
      nomeTitular: "",
      planoSaudeId: "",
      pacienteId: "",
    },
  });

  useEffect(() => {
    if (carteirinha) {
      form.reset({
        numero: carteirinha.numero,
        dataValidade: carteirinha.dataValidade,
        titular: carteirinha.titular,
        nomeTitular: carteirinha.nomeTitular,
        planoSaudeId: carteirinha.planoSaudeId,
        pacienteId: carteirinha.pacienteId,
      });
    } else {
      form.reset({
        numero: "",
        dataValidade: "",
        titular: false,
        nomeTitular: "",
        planoSaudeId: "",
        pacienteId: "",
      });
    }
  }, [carteirinha, form]);

  async function onSubmit(values: CarteirinhaFormValues) {
    try {
      // Validate and format the date
      const dateValue = values.dataValidade;
      if (!dateValue) {
        throw new Error("Data de validade é obrigatória");
      }

      // Ensure the date is in YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateValue)) {
        throw new Error("Data deve estar no formato YYYY-MM-DD");
      }

      const formattedValues = {
        ...values,
        dataValidade: dateValue,
      };

      if (carteirinha) {
        await atualizarCarteirinha(carteirinha.id, formattedValues);
        toast({
          title: "Sucesso",
          description: "Carteirinha atualizada com sucesso",
        });
      } else {
        await criarCarteirinha(formattedValues);
        toast({
          title: "Sucesso",
          description: "Carteirinha criada com sucesso",
        });
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao salvar carteirinha",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {carteirinha ? "Editar Carteirinha" : "Nova Carteirinha"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Carteirinha</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o número" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dataValidade"
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
              name="titular"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Titular</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {!form.watch("titular") && (
              <FormField
                control={form.control}
                name="nomeTitular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Titular</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do titular" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="planoSaudeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Saúde</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {planos.map((plano) => (
                        <SelectItem key={plano.id} value={plano.id}>
                          {plano.nome}
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
              name="pacienteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um paciente" />
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
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}