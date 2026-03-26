import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, X, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { createAction } from '@/services/admin/apiActions';

// ─── Local form schema for create (API/RPC only) ──────────────────────────────
const createActionFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name required')
    .regex(/^[a-z][a-z0-9_]*$/, 'Lowercase, start with letter, underscores only'),
  description: z.string().min(1, 'Description required').max(500),
  type: z.enum(['api_request', 'rpc_request']),
  active: z.boolean(),
  requires_confirmation: z.boolean(),
  url: z.string().optional(),
  protocol: z.enum(['http', 'https', 'grpc']).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  host: z.string().optional(),
  service_name: z.string().optional(),
  proto_file: z.string().optional(),
});
type CreateFormT = z.infer<typeof createActionFormSchema>;

interface IProps {
  open: boolean;
  onClose: () => void;
}

const ModalCreateAction = ({ open, onClose }: IProps) => {
  const qc = useQueryClient();

  const form = useForm<CreateFormT>({
    resolver: zodResolver(createActionFormSchema),
    defaultValues: { type: 'api_request', active: true, requires_confirmation: false, protocol: 'https', method: 'POST' },
  });

  const actionType = form.watch('type');

  // Reset execution fields when type changes
  useEffect(() => {
    form.setValue('url', '');
    form.setValue('host', '');
    form.setValue('service_name', '');
    form.setValue('proto_file', '');
  }, [actionType]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: Record<string, unknown>) => createAction(data),
    onSuccess: (res) => {
      toast.success(`Action "${res.name}" created`);
      qc.invalidateQueries({ queryKey: ['actions'] });
      form.reset();
      onClose();
    },
    onError: (e) => toast.error((e as Error).message || 'Create failed'),
  });

  const onSubmit: SubmitHandler<CreateFormT> = (data) => {
    const exec: Record<string, unknown> = { protocol: data.protocol, timeout: 5000 };
    if (data.type === 'api_request') {
      exec.url = data.url;
      exec.method = data.method;
    } else {
      exec.host = data.host;
      exec.service = data.service_name;
      exec.method = data.method;
      exec.proto_file = data.proto_file;
    }

    mutate({
      name: data.name,
      description: data.description,
      type: data.type,
      active: data.active,
      requires_confirmation: data.requires_confirmation,
      execution_config: exec,
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40! bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50! flex items-center justify-center p-4!">
        <div className="bg-card w-full max-w-lg rounded-2xl border shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6! py-4!">
            <div className="flex items-center gap-2.5!">
              <div className="flex h-8! w-8! items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Zap className="h-4! w-4! text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold">New Action</h2>
            </div>
            <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5! hover:bg-muted">
              <X className="h-4! w-4!" />
            </button>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4! p-6!">
              {/* Type selector */}
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="!h-10 px-4!"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem className='p-2!' value="api_request">API Request (HTTP/HTTPS)</SelectItem>
                      <SelectItem className='p-2!' value="rpc_request">RPC Request (gRPC)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Name */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name <span className="text-muted-foreground text-xs">(lowercase_underscore)</span></FormLabel>
                  <FormControl><Input placeholder="e.g. create_ticket" className="font-mono px-4!" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Description */}
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input placeholder="What does this action do?" className='font-mono px-4!' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* API-specific fields */}
              {actionType === 'api_request' && (
                <div className="space-y-3! rounded-xl border bg-blue-50/40 p-4! dark:bg-blue-950/20">
                  <p className="flex items-center gap-1.5! text-xs font-semibold text-blue-700 dark:text-blue-400">
                    <Info className="h-3.5! w-3.5!" /> HTTP Configuration
                  </p>
                  <div className="grid grid-cols-2 gap-3!">
                    <FormField control={form.control} name="protocol" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protocol</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="!h-9 px-4!"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem className='p-2!' value="https">HTTPS</SelectItem>
                            <SelectItem className='p-2!' value="http">HTTP</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="method" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="!h-9 px-4!"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                              <SelectItem className='p-2!' key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="url" render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl><Input placeholder="https://api.example.com/endpoint" className='font-mono px-4!' {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* RPC-specific fields */}
              {actionType === 'rpc_request' && (
                <div className="space-y-3! rounded-xl border bg-violet-50/40 p-4! dark:bg-violet-950/20">
                  <p className="flex items-center gap-1.5! text-xs font-semibold text-violet-700 dark:text-violet-400">
                    <Info className="h-3.5! w-3.5!" /> gRPC Configuration
                  </p>
                  <FormField control={form.control} name="host" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host</FormLabel>
                      <FormControl><Input placeholder="localhost:50051" className='font-mono px-4!' {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3!">
                    <FormField control={form.control} name="service_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <FormControl><Input placeholder="MyService" className='font-mono px-4!' {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="method" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method</FormLabel>
                        <FormControl><Input placeholder="MyMethod" className='font-mono px-4!' {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="proto_file" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proto File Path</FormLabel>
                      <FormControl><Input placeholder="/path/to/service.proto" className='font-mono px-4!' {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2! rounded-lg border border-destructive/30 bg-destructive/8 px-3.5! py-2.5! text-sm text-destructive">
                  <AlertCircle className="h-4! w-4! shrink-0" />
                  <span>{(error as Error).message}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-2! pt-2!">
                <Button type="button" variant="outline" className="cursor-pointer px-4!" onClick={() => { form.reset(); onClose(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="cursor-pointer px-8!" disabled={isPending}>
                  {isPending ? <Spinner className="size-4!" /> : 'Create Action'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
};

export default ModalCreateAction;
