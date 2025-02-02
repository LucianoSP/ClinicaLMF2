'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Paciente } from "@/types/paciente"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { criarPaciente, atualizarPaciente } from "@/services/pacienteService"

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  nome_responsavel: z.string().min(1, "Nome do responsável é obrigatório"),
  data_nascimento: z.string().optional(),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  altura: z.string().optional(),
  peso: z.string().optional(),
  tipo_sanguineo: z.string().optional(),
})

interface PacienteFormProps {
  paciente?: Paciente;
  onSuccess?: () => void;
}

export function PacienteForm({ paciente, onSuccess }: PacienteFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: paciente?.nome || "",
      nome_responsavel: paciente?.nome_responsavel || "",
      data_nascimento: paciente?.data_nascimento || "",
      cpf: paciente?.cpf || "",
      telefone: paciente?.telefone || "",
      email: paciente?.email || "",
      altura: paciente?.altura || "",
      peso: paciente?.peso || "",
      tipo_sanguineo: paciente?.tipo_sanguineo || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (paciente) {
        await atualizarPaciente(paciente.id, values)
        toast({
          title: "Sucesso",
          description: "Paciente atualizado com sucesso!",
        })
      } else {
        await criarPaciente(values)
        toast({
          title: "Sucesso",
          description: "Paciente criado com sucesso!",
        })
      }

      // Invalida o cache para forçar uma nova busca
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
      
      // Chama o callback de sucesso se existir
      onSuccess?.()

      // Reseta o formulário
      form.reset()
    } catch (error) {
      console.error('Erro ao salvar paciente:', error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar paciente. Tente novamente.",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do paciente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nome_responsavel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Responsável</FormLabel>
              <FormControl>
                <Input placeholder="Nome do responsável" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data_nascimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Nascimento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
                <Input placeholder="CPF" {...field} />
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
                <Input placeholder="Telefone" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="altura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Altura</FormLabel>
              <FormControl>
                <Input placeholder="Altura" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="peso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peso</FormLabel>
              <FormControl>
                <Input placeholder="Peso" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_sanguineo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Sanguíneo</FormLabel>
              <FormControl>
                <Input placeholder="Tipo Sanguíneo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {paciente ? "Atualizar" : "Cadastrar"}
        </Button>
      </form>
    </Form>
  )
}