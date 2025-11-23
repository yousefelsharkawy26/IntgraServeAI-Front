import {
  updateUserRolesRequestSchema,
  updateUserRolesRequestT,
} from '@/schema/admin/updateUserRolesSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldErrors, SubmitHandler, useForm } from 'react-hook-form';
import { useAllRoles } from './useAllRoles';
import { useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

interface IProps {
  onSubmit: SubmitHandler<updateUserRolesRequestT>;
  onError: SubmitHandler<FieldErrors>;
  classNames?: {
    inputClassName?: string;
  };
}

const FormUpdateUserRoles = ({ onError, onSubmit, classNames }: IProps) => {
  const form = useForm<updateUserRolesRequestT>({
    resolver: zodResolver(updateUserRolesRequestSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      roles_id: [],
    },
  });

  const { dataAllRoles } = useAllRoles();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleRoleChange = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  return (
    <Form {...form}>
      <form
        id="update-user-roles-form"
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="flex flex-col gap-4 space-y-6"
      >
        {/* Roles Selection */}
        <FormField
          control={form.control}
          name="roles_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Roles</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-2">
                  {dataAllRoles?.map((role) => (
                    <div key={role.id} className="flex items-center">
                      <Checkbox
                        className={classNames?.inputClassName}
                        id={role.id}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={(checked) => {
                          handleRoleChange(role.id);
                          field.onChange(
                            checked
                              ? [...(field.value || []), role.id]
                              : (field.value || []).filter(
                                  (id) => id !== role.id,
                                ),
                          );
                        }}
                        {...field}
                      />
                      <label htmlFor={role.id} className="ml-2">
                        {role.name}
                      </label>
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Display selected roles as badges */}
        {selectedRoles.length > 0 && (
          <div className="mt-4 flex gap-2">
            {selectedRoles.map((roleId) => {
              const role = dataAllRoles?.find((r) => r.id === roleId);
              return (
                role && (
                  <div
                    key={role.id}
                    className="rounded-md border border-zinc-500 !px-1"
                  >
                    {role.name}
                  </div>
                )
              );
            })}
          </div>
        )}
      </form>
    </Form>
  );
};

export default FormUpdateUserRoles;
