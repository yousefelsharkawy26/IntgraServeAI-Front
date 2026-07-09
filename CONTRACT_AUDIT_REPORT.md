# Frontend ↔ Backend Contract Audit Report

## Root Cause

The previous audit fixed internal frontend bugs (double-mapping, missing mapper branches, etc.) but **never compared the frontend's request payload against the backend's Pydantic models**. Every Pydantic schema uses `extra="forbid"`, meaning any missing required field or extra/invalid field causes an immediate 422 validation error — before the service layer even runs.

---

## 8 Contract Mismatches Found

### Mismatch 1: `name` pattern (CRITICAL — breaks most creates)

| | Frontend | Backend |
|---|---|---|
| **Before** | `z.string().min(1)` — accepts anything | `pattern=r'^[a-z][a-z0-9_]*$'` |
| **After** | `z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, ...)` | (unchanged) |

**Backend code** (`utils/schemas/action_schemas.py:169`):
```python
name: str = Field(
    ...,
    min_length=1, max_length=100,
    pattern=r'^[a-z][a-z0-9_]*$',
    description="Unique action name (lowercase, underscores allowed)"
)
```

**Why it broke:** User enters "Get Product Info" → backend pattern rejects at Pydantic level → 422. The `@field_validator('name')` lowercases the value, but it runs **after** the pattern check (Pydantic v2 `mode='after'`), so uppercase names never reach it.

**Fix:** Added Zod `.regex()` validation + helper text in form.

---

### Mismatch 2: `parameters.*.param_type` (CRITICAL — breaks all creates with parameters)

| | Frontend | Backend |
|---|---|---|
| **Before** | Hard-coded `'string'` | Must be one of `["query", "body", "path"]` (api_request), `["message_field"]` (rpc_request), `["vector"]` (vector_query) |
| **After** | User selects from dropdown | (unchanged) |

**Backend code** (`utils/schemas/action_schemas.py:33-39`):
```python
ACTION_TYPE_CONFIG = {
    ActionType.API_REQUEST: {"allowed_param_types": ["query", "body", "path"], ...},
    ActionType.RPC_REQUEST: {"allowed_param_types": ["message_field"], ...},
    ActionType.VECTOR_QUERY: {"allowed_param_types": ["vector"], ...},
}
```

**Backend validation** (`services/action_service.py:420-423`):
```python
if param_type not in allowed_param_types:
    raise InvalidParamTypeException(param_type, action_type.value, allowed_param_types)
```

**Why it broke:** `param_type: 'string'` is not in ANY allowed list → `InvalidParamTypeException` (422).

**Fix:** Added `paramType` field to `ActionParameter` + dropdown in form (defaults to `query`/`body` based on HTTP method).

---

### Mismatch 3: `parameters.*.description` (CRITICAL — breaks all creates with parameters)

| | Frontend | Backend |
|---|---|---|
| **Before** | Not sent | `description: str = Field(...)` — **REQUIRED** |
| **After** | Sent from form input | (unchanged) |

**Backend code** (`utils/schemas/action_schemas.py:95`):
```python
class ActionParameter(BaseModel):
    description: str = Field(..., description="Description of the parameter")
    model_config = ConfigDict(extra="forbid")
```

**Why it broke:** Missing required field → Pydantic 422.

**Fix:** Added `description` input to parameter rows in form.

---

### Mismatch 4: `response_config.template` (CRITICAL — breaks creates with response config)

| | Frontend | Backend |
|---|---|---|
| **Before** | Not sent | `template: str = Field(...)` — **REQUIRED** |
| **After** | Sent from form input (default: `"{{result}}"`) | (unchanged) |

**Backend code** (`utils/schemas/action_schemas.py:120`):
```python
class ResponseConfig(BaseModel):
    template: str = Field(..., description="Template for successful response")
    model_config = ConfigDict(extra="forbid")
```

**Why it broke:** Missing required field → Pydantic 422.

**Fix:** Added `template` input to response config section + default in `buildCreatePayload`.

---

### Mismatch 5: `response_config.on_error` (CRITICAL — breaks creates with response config)

| | Frontend | Backend |
|---|---|---|
| **Before** | Not sent | `on_error: str = Field(...)` — **REQUIRED** |
| **After** | Sent from form input (default: `"Action execution failed"`) | (unchanged) |

**Backend code** (`utils/schemas/action_schemas.py:121`):
```python
class ResponseConfig(BaseModel):
    on_error: str = Field(..., description="Message template for error responses")
```

**Why it broke:** Missing required field → Pydantic 422.

**Fix:** Added `onError` input + default in `buildCreatePayload`.

---

### Mismatch 6: `execution_config.protocol` for RPC (CRITICAL — breaks ALL RPC creates)

| | Frontend | Backend |
|---|---|---|
| **Before** | Not sent for RPC | Required: must be `"grpc"` |
| **After** | Set to `'grpc'` in `buildCreatePayload` | (unchanged) |

**Backend code** (`utils/schemas/action_schemas.py:27-30`):
```python
ActionType.RPC_REQUEST: {
    "required_exec_fields": ["protocol", "host", "service", "method", "proto_file"],
}
```

**Backend validation** (`services/action_service.py:385-388`):
```python
if protocol != "grpc":
    raise InvalidActionFieldException(f"protocol={protocol}", "rpc_request (must be grpc)")
```

**Why it broke:** Missing required field → `MissingFieldException("protocol", "execution_config")` (422).

**Fix:** Added `execution_config.protocol = 'grpc'` for `rpc_request` in `buildCreatePayload`.

---

### Mismatch 7: `execution_config.connector` for vector_query (CRITICAL — breaks ALL vector creates)

| | Frontend | Backend |
|---|---|---|
| **Before** | Not sent for vector | Required field |
| **After** | Sent from new form field | (unchanged) |

**Backend code** (`utils/schemas/action_schemas.py:39-41`):
```python
ActionType.VECTOR_QUERY: {
    "required_exec_fields": ["connector", "connection_string", "collection_name"],
}
```

**Why it broke:** Missing required field → `MissingFieldException("connector", "execution_config")` (422).

**Fix:** Added `connector` input to VectorConfigFields form + mapping in `buildCreatePayload`.

---

### Mismatch 8: `execution_config.connection_string` for vector_query (CRITICAL — breaks ALL vector creates)

| | Frontend | Backend |
|---|---|---|
| **Before** | Not sent for vector | Required field |
| **After** | Sent from new form field | (unchanged) |

**Why it broke:** Same as #7 — missing required field.

**Fix:** Added `connectionString` input to VectorConfigFields form + mapping in `buildCreatePayload`.

---

## Payload Comparison (api_request example)

### Before (BROKEN — 422)
```json
{
  "name": "Get Product Info",
  "description": "Fetches product details",
  "type": "api_request",
  "active": true,
  "requires_confirmation": false,
  "execution_config": {
    "protocol": "https",
    "method": "POST",
    "url": "https://api.example.com/products",
    "timeout": 5000
  },
  "parameters": {
    "product_id": {
      "type": "string",
      "required": true,
      "param_type": "string",        ← INVALID: not in ["query","body","path"]
      "default": "123"               ← MISSING: "description" is required
    }
  },
  "response_config": {
    "mode": "json",
    "values": { "default": { "type": "string", "path": "data.result" } }
                                      ← MISSING: "template" is required
                                      ← MISSING: "on_error" is required
  }
}
```

### After (VALID)
```json
{
  "name": "get_product_info",
  "description": "Fetches product details",
  "type": "api_request",
  "active": true,
  "requires_confirmation": false,
  "execution_config": {
    "protocol": "https",
    "method": "POST",
    "url": "https://api.example.com/products",
    "timeout": 5000
  },
  "parameters": {
    "product_id": {
      "type": "string",
      "required": true,
      "param_type": "query",           ← FIXED
      "description": "The product ID", ← FIXED
      "default": "123"
    }
  },
  "response_config": {
    "mode": "json",
    "values": { "default": { "type": "string", "path": "data.result" } },
    "template": "{{result}}",          ← FIXED
    "on_error": "Action execution failed" ← FIXED
  }
}
```

---

## Files Modified (7 files)

| File | Changes |
|------|---------|
| `src/types/action.ts` | Added `paramType`/`description` to `ActionParameter`; added `connector`/`connectionString` to `VectorQueryConfig`; added `template`/`onError` to `FormResponseConfig`; expanded `ExecutionConfig.protocol` to include `'grpc'`; expanded `BackendResponseConfig.mode` to include `'xml'`/`'html'`; made `ParameterDetail.description` required |
| `src/schemas/actionSchema.ts` | Added `.regex()` to name; added `paramType`/`description` to parameter schema; added `connector`/`connectionString` to vector schema with `.min(1)`; added `template`/`onError` to response config schema; updated defaults |
| `src/lib/actionTransforms.ts` | Fixed `parametersToDict` to use `paramType`/`description`; fixed `parametersFromDict` to extract these; added `protocol: 'grpc'` for RPC; added `connector`/`connection_string` for vector; added `template`/`on_error` to `response_config`; added `connector`/`connectionString` to `actionToFormData` |
| `src/mappers/action.mapper.ts` | Added `paramType`/`description` to parameter mapping; added `template`/`onError` to response config; added `connector`/`connectionString` to vector mapping |
| `src/features/actions/components/fields/ApiConfigFields.tsx` | Added `paramType` dropdown + `description` input per parameter row; added `template`/`onError` inputs for response config |
| `src/features/actions/components/fields/VectorConfigFields.tsx` | Added `connector` + `connectionString` inputs |
| `src/features/actions/components/fields/BasicInfoFields.tsx` | Added name format hint text; updated placeholder |

---

## Minor Backend Observation (not a blocking bug)

`UnsupportedActionTypeException.SUPPORTED_TYPES` lists only `["api_request", "rpc_request", "internal"]` — missing `"vector_query"`. This doesn't block creation (the `ActionType` enum includes `VECTOR_QUERY`), but the error message would be misleading if an unsupported type is ever sent.

---

## Confidence Level: **HIGH**

Every mismatch was verified by:
1. Reading the exact backend Pydantic schema field definitions
2. Reading the backend service-level validation rules
3. Tracing the complete frontend payload construction path
4. Confirming TypeScript compilation passes with zero errors
5. Verifying that no `extra="forbid"` violations remain (all payload fields match backend model fields exactly)
