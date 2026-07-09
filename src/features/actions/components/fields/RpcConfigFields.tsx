import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionFormData } from '@/schemas/actionSchema'
import { ParameterFields } from './ParameterFields'
import { ResponseConfigFields } from './ResponseConfigFields'

export function RpcConfigFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ActionFormData>()

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        RPC Configuration
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Host</Label>
          <Input
            {...register('rpcConfig.host')}
            placeholder="localhost:50051"
            className="mt-1 h-9 text-xs"
          />
          {errors.rpcConfig?.host && (
            <p className="mt-1 text-xs text-red-500">
              {errors.rpcConfig.host.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Service</Label>
          <Input
            {...register('rpcConfig.service')}
            placeholder="BookingService"
            className="mt-1 h-9 text-xs"
          />
          {errors.rpcConfig?.service && (
            <p className="mt-1 text-xs text-red-500">
              {errors.rpcConfig.service.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Method</Label>
          <Input
            {...register('rpcConfig.method')}
            placeholder="BookFlight"
            className="mt-1 h-9 text-xs"
          />
          {errors.rpcConfig?.method && (
            <p className="mt-1 text-xs text-red-500">
              {errors.rpcConfig.method.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Proto File</Label>
          <Input
            {...register('rpcConfig.protoFile')}
            placeholder="./protos/booking.proto"
            className="mt-1 h-9 text-xs"
          />
          {errors.rpcConfig?.protoFile && (
            <p className="mt-1 text-xs text-red-500">
              {errors.rpcConfig.protoFile.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Timeout (ms)</Label>
          <Input
            type="number"
            {...register('rpcConfig.timeout', { valueAsNumber: true })}
            className="mt-1 h-9 text-xs"
          />
        </div>
      </div>

      <ParameterFields basePath="rpcConfig" actionType="rpc_request" />
      <ResponseConfigFields basePath="rpcConfig" actionType="rpc_request" />
    </div>
  )
}
