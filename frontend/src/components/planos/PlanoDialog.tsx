'use client';

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
import { Plano } from "@/types/plano";
import { criarPlano, atualizarPlano } from "@/services/planoService";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  codigo: z.string().min(1, "Código é obrigatório"),
  ativo: z.boolean().default(true),
});

type PlanoFormValues = z.infer<typeof formSchema>;

interface PlanoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano: Plano | null;
  onSuccess: () => void;
}

export function PlanoDialog({ open, onOpenChange, plano, onSuccess }: PlanoDialogProps) {
  const { toast } = useToast();
  const form = useForm<PlanoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: plano?.nome || "",
      codigo: plano?.codigo || "",
      ativo: plano?.ativo ?? true,
    },
  });

  useEffect(() => {
    if (plano) {
      form.reset({
        nome: plano.nome,
        codigo: plano.codigo,
        ativo: plano.ativo,
      });
    } else {
      form.reset({
        nome: "",
        codigo: "",
        ativo: true,
      });
    }
  }, [form, plano]);

  async function onSubmit(values: PlanoFormValues) {
    try {
      if (plano?.id) {
        await atualizarPlano(plano.id, {
          nome: values.nome,
          codigo: values.codigo,
          ativo: values.ativo,
        });
      } else {
        await criarPlano({
          nome: values.nome,
          codigo: values.codigo,
          ativo: values.ativo,
        });
      }
      toast({
        title: plano ? "Plano atualizado" : "Plano criado",
        description: plano
          ? "O plano foi atualizado com sucesso."
          : "O plano foi criado com sucesso.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao salvar o plano.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{plano ? "Editar Plano" : "Novo Plano"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do plano" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="Código do plano" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativo</FormLabel>
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
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
