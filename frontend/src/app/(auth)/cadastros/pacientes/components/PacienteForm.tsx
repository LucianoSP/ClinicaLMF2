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
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  nome_responsavel: z.string().min(1, "Nome do responsável é obrigatório").max(100, "Nome do responsável muito longo"),
  data_nascimento: z.string().optional(),
  cpf: z.string().max(11, "CPF deve ter no máximo 11 dígitos").optional(),
  telefone: z.string().max(11, "Telefone deve ter no máximo 11 dígitos").optional(),
  email: z.string().email("Email inválido").max(100, "Email muito longo").optional().or(z.literal("")),
  altura: z.string().max(5, "Altura deve ter no máximo 5 caracteres").optional(),
  peso: z.string().max(5, "Peso deve ter no máximo 5 caracteres").optional(),
  tipo_sanguineo: z.string().max(3, "Tipo sanguíneo deve ter no máximo 3 caracteres").optional(),
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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Remove caracteres não numéricos do CPF e telefone
      if (data.cpf) {
        data.cpf = data.cpf.replace(/\D/g, '')
      }
      if (data.telefone) {
        data.telefone = data.telefone.replace(/\D/g, '')
      }

      if (paciente?.id) {
        await atualizarPaciente(paciente.id, data)
        toast({
          title: "Paciente atualizado com sucesso!",
          variant: "success",
        })
      } else {
        await criarPaciente(data)
        toast({
          title: "Paciente criado com sucesso!",
          variant: "success",
        })
      }
      
      queryClient.invalidateQueries(['pacientes'])
      if (onSuccess) onSuccess()
      router.push('/cadastros/pacientes')
    } catch (error: any) {
      console.error('Erro ao salvar paciente:', error)
      toast({
        title: "Erro ao salvar paciente",
        description: error.response?.data?.detail || "Ocorreu um erro ao salvar o paciente",
        variant: "destructive",
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