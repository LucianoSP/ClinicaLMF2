'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Carteirinha } from '@/types/Carteirinha'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2 } from 'lucide-react'

const carteirinhaFormSchema = z.object({
  numero_carteirinha: z.string().min(1, 'Número da carteirinha é obrigatório'),
  data_validade: z.date().optional(),
  status: z.enum(['ativa', 'inativa']),
  motivo_inativacao: z.string().optional(),
  paciente_id: z.string().min(1, 'Paciente é obrigatório'),
  plano_saude_id: z.string().min(1, 'Plano de saúde é obrigatório'),
})

type CarteirinhaFormData = z.infer<typeof carteirinhaFormSchema>

interface CarteirinhaFormProps {
  initialData?: Partial<Carteirinha>
  onSubmit: (data: CarteirinhaFormData) => void
  onCancel: () => void
}

export function CarteirinhaForm({
  initialData,
  onSubmit,
  onCancel,
}: CarteirinhaFormProps) {
  const form = useForm<CarteirinhaFormData>({
    resolver: zodResolver(carteirinhaFormSchema),
    defaultValues: {
      numero_carteirinha: initialData?.numero_carteirinha || '',
      data_validade: initialData?.data_validade ? new Date(initialData.data_validade) : undefined,
      status: initialData?.status || 'ativa',
      motivo_inativacao: initialData?.motivo_inativacao || '',
      paciente_id: initialData?.paciente_id || '',
      plano_saude_id: initialData?.plano_saude_id || '',
    },
  })

  const isSubmitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="numero_carteirinha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número da Carteirinha</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSubmitting} />
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
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('status') === 'inativa' && (
          <FormField
            control={form.control}
            name="motivo_inativacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo da Inativação</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
