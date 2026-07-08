// ============================================================
// Human Tool Runtime — Payload Validation
// ============================================================
// Validates tool payloads against schemas before sending to backend.
// Prevents malformed data from reaching the server.
// ============================================================

import type { ToolSchema, SchemaField, ValidationResult, ValidationError } from './types'

/**
 * Validate a payload against a tool schema.
 */
export function validatePayload(
  payload: unknown,
  schema: ToolSchema
): ValidationResult {
  if (!schema?.fields || schema.fields.length === 0) {
    return { valid: true }
  }
  
  const errors: ValidationError[] = []
  const data = (payload as Record<string, unknown>) || {}
  
  for (const field of schema.fields) {
    const value = data[field.name]
    const fieldErrors = validateField(field, value)
    errors.push(...fieldErrors)
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validate a single field against its schema definition.
 */
function validateField(field: SchemaField, value: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Required check
  if (field.required && (value === undefined || value === null || value === '')) {
    errors.push({
      field: field.name,
      message: `${field.label || field.name} is required`,
      code: 'required',
    })
    return errors // No point validating further if missing
  }
  
  // Skip further validation if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return errors
  }
  
  // Type-specific validation
  switch (field.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push({
          field: field.name,
          message: `${field.label || field.name} must be a string`,
          code: 'type_mismatch',
        })
      } else {
        if (field.min !== undefined && value.length < field.min) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} must be at least ${field.min} characters`,
            code: 'min_length',
          })
        }
        if (field.max !== undefined && value.length > field.max) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} must be at most ${field.max} characters`,
            code: 'max_length',
          })
        }
        if (field.pattern) {
          const regex = new RegExp(field.pattern)
          if (!regex.test(value)) {
            errors.push({
              field: field.name,
              message: `${field.label || field.name} format is invalid`,
              code: 'pattern_mismatch',
            })
          }
        }
      }
      break
      
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push({
          field: field.name,
          message: `${field.label || field.name} must be a number`,
          code: 'type_mismatch',
        })
      } else {
        if (field.min !== undefined && value < field.min) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} must be at least ${field.min}`,
            code: 'min_value',
          })
        }
        if (field.max !== undefined && value > field.max) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} must be at most ${field.max}`,
            code: 'max_value',
          })
        }
      }
      break
      
    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({
          field: field.name,
          message: `${field.label || field.name} must be a boolean`,
          code: 'type_mismatch',
        })
      }
      break
      
    case 'enum':
      if (!field.options || !field.options.includes(value as string)) {
        errors.push({
          field: field.name,
          message: `${field.label || field.name} must be one of: ${field.options?.join(', ')}`,
          code: 'enum_mismatch',
        })
      }
      break
      
    case 'array':
      if (!Array.isArray(value)) {
        errors.push({
          field: field.name,
          message: `${field.label || field.name} must be an array`,
          code: 'type_mismatch',
        })
      } else {
        if (field.min !== undefined && value.length < field.min) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} must have at least ${field.min} items`,
            code: 'min_items',
          })
        }
        if (field.max !== undefined && value.length > field.max) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} must have at most ${field.max} items`,
            code: 'max_items',
          })
        }
        // Validate items if schema provided
        if (field.items) {
          value.forEach((item, index) => {
            const itemErrors = validateField(field.items!, item)
            itemErrors.forEach((err) => {
              errors.push({
                ...err,
                field: `${field.name}[${index}].${err.field}`,
              })
            })
          })
        }
      }
      break
      
    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push({
          field: field.name,
          message: `${field.label || field.name} must be an object`,
          code: 'type_mismatch',
        })
      } else if (field.properties) {
        const obj = value as Record<string, unknown>
        for (const [propName, propSchema] of Object.entries(field.properties)) {
          const propErrors = validateField(propSchema, obj[propName])
          propErrors.forEach((err) => {
            errors.push({
              ...err,
              field: `${field.name}.${err.field}`,
            })
          })
        }
      }
      break
  }
  
  return errors
}

/**
 * Validate a ToolResult before sending to backend.
 */
export function validateToolResult(result: {
  toolCallId: string
  status: string
  payload?: unknown
}): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!result.toolCallId || typeof result.toolCallId !== 'string') {
    errors.push({
      field: 'toolCallId',
      message: 'toolCallId is required and must be a string',
      code: 'invalid_tool_call_id',
    })
  }
  
  if (!['success', 'cancelled', 'failed'].includes(result.status)) {
    errors.push({
      field: 'status',
      message: 'status must be one of: success, cancelled, failed',
      code: 'invalid_status',
    })
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}
