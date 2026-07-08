# Human Tool Runtime — Production Architecture Documentation

> **Commit**: [`f0406e5`](https://github.com/yousefelsharkawy26/IntgraServeAI-Front/commit/f0406e5)  
> **Tests**: 51/51 passing  
> **TypeScript**: Zero errors  

---

## Table of Contents

1. [Architecture Review](#1-architecture-review)
2. [Design Decisions](#2-design-decisions)
3. [File Structure](#3-file-structure)
4. [State Machine](#4-state-machine)
5. [Sequence Diagrams](#5-sequence-diagrams)
6. [Protocol Specification](#6-protocol-specification)
7. [Tool SDK API](#7-tool-sdk-api)
8. [Registry API](#8-registry-api)
9. [Plugin API](#9-plugin-api)
10. [Testing Strategy](#10-testing-strategy)
11. [Remaining Limitations](#11-remaining-limitations)
12. [Future Improvements](#12-future-improvements)

---

## 1. Architecture Review

### Issues Found in Previous Implementation

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 1 | Registry violated SRP (stored + resolved + fuzzy-matched) | High | Split into pure describe/resolve module |
| 2 | No versioning support | High | Added `type@version` resolution with defaults |
| 3 | No lazy loading (all tools eagerly imported) | Medium | `React.lazy()` for all tool components |
| 4 | No metadata (permissions, capabilities, schema) | High | Full `HumanToolDefinition` with 12 fields |
| 5 | Tool SDK too thin (only sendResult/cancel/fail) | High | Rich SDK: progress, logging, busy state, validation |
| 6 | No payload validation before sending | High | Schema-based + custom validator support |
| 7 | Unknown tool required user interaction | Medium | Auto-fails with `reason: 'unsupported_tool'` |
| 8 | No explicit state machine | High | `lifecycle.ts` with valid transitions map |
| 9 | No error recovery on disconnect | Medium | Tool state preserved across reconnect |
| 10 | Context too thin (no metadata/schema/permissions) | Medium | Full `ToolMetadata` with 10 fields |

### Module Responsibilities (SRP)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODULE RESPONSIBILITIES                       │
├──────────────────┬──────────────────────────────────────────────┤
│ types.ts         │ Type definitions ONLY. No logic.             │
│ lifecycle.ts     │ State machine + valid transitions.           │
│ registry.ts      │ Describe + resolve tools. No execution.      │
│ sdk.ts           │ Tool SDK (useTool hook). Tool-facing API.   │
│ runtime.tsx      │ Render + error boundary + unknown handler.   │
│ validation.ts    │ Schema-based payload validation.             │
│ plugin.ts        │ High-level registration API.                 │
│ definition.ts    │ Per-tool metadata + lazy component import.   │
│ ChatPage.tsx     │ Transport bridge ONLY. No tool knowledge.    │
│ useChatWebSocket │ WebSocket state + events. No tool knowledge. │
└──────────────────┴──────────────────────────────────────────────┘
```

**Key principle**: Each module can be replaced independently. Swap the registry for a remote one, swap the transport for HTTP, swap the renderer for a native one — without affecting other modules.

---

## 2. Design Decisions

### D1: Registry is NOT a God Object

The registry only **describes** and **resolves** tools. It does not:
- Execute tools
- Validate payloads
- Render components
- Manage state
- Transport results

This means you can replace the registry (e.g., with a remote registry that fetches tool definitions from an API) without touching any other module.

### D2: Backend Owns the Lifecycle

The frontend never invents terminal states. The only contract is:
```
Backend → tool_start → pause → show_tool_ui → [waits for tool_result]
Frontend → tool_result → [waits for tool_end]
Backend → tool_end(status)
```

The `done` handler has a safety net that finalizes running tools, but this is a fallback for backend bugs, not the primary mechanism.

### D3: Transport Abstraction

The `ToolTransport` interface decouples the SDK from WebSocket:
```typescript
interface ToolTransport {
  sendResult(toolCallId, status, payload?, reason?): void
  sendProgress?(toolCallId, percent, message?): void
  sendLog?(toolCallId, message, level): void
}
```

This allows testing tools without a WebSocket connection, and potentially using HTTP or other transports in the future.

### D4: Lazy Loading via React.lazy()

Every tool component is lazy-loaded:
```typescript
const CreateTicketTool = lazy(() =>
  import('./CreateTicketTool').then(m => ({ default: m.CreateTicketTool }))
)
```

The runtime wraps tools in `<Suspense>` with a loading fallback. This keeps initial bundle size small regardless of how many tools are registered.

### D5: Versioning with Default Resolution

Tools are registered as `type@version`. Resolution order:
1. Exact match: `create_ticket@v2`
2. Default version: `create_ticket` → `create_ticket@v2` (if v2 is default)
3. Latest version: highest version number
4. Fuzzy match: partial name matching

The backend can request a specific version: `{ action_name: "create_ticket@v1" }`.

### D6: Unknown Tools Auto-Fail

When an unknown tool is requested:
1. `UnknownToolHandler` mounts
2. Immediately sends `{ type: 'tool_result', status: 'failed', reason: 'unsupported_tool' }`
3. Shows a friendly UI explaining the tool is unavailable
4. The backend receives the failure and can take corrective action

The backend never waits forever for an unknown tool.

---

## 3. File Structure

```
src/features/chat/tools/
├── types.ts                          # Core types (ToolStatus, ToolResult, etc.)
├── lifecycle.ts                      # State machine + valid transitions
├── registry.ts                       # Registry (describe + resolve only)
├── sdk.ts                            # Tool SDK: useTool() hook
├── runtime.tsx                       # Renderer + ErrorBoundary + UnknownToolHandler
├── validation.ts                     # Schema-based payload validation
├── plugin.ts                         # Plugin registration API
├── index.ts                          # Public API barrel + auto-registration
├── create-ticket/
│   ├── definition.ts                 # Lazy definition with schema + metadata
│   └── CreateTicketTool.tsx          # Component using useTool()
└── select-product/
    ├── definition.ts                 # Lazy definition with schema + metadata
    └── SelectProductTool.tsx         # Component using useTool()
```

---

## 4. State Machine

### Valid Transitions

```
                    ┌──────────────────────────────────────────┐
                    │                                          │
                    ▼                                          │
              ┌───────────┐                                    │
              │  PENDING   │──────────────────────┐            │
              └─────┬─────┘                      │            │
                    │                             │            │
              tool_started                   cancel/          │
                    │                         timeout         │
                    ▼                             │            │
              ┌───────────┐                       │            │
        ┌────►│  RUNNING   │◄─────────────────┐   │            │
        │     └─────┬─────┘                  │   │            │
        │           │                         │   │            │
        │     ┌─────┼──────────┐             │   │            │
        │     │     │          │             │   │            │
        │     ▼     ▼          ▼             │   ▼            │
        │  ┌──────┐ ┌───────┐ ┌──────┐      │ ┌──────┐      │
        │  │WAIT_ │ │WAIT_  │ │COMPL-│      │ │CANC- │      │
        │  │FOR_  │ │FOR_   │ │ETED  │      │ │ELLED │      │
        │  │APPR. │ │INPUT  │ │      │      │ │      │      │
        │  └──┬───┘ └──┬────┘ └──────┘      │ └──────┘      │
        │     │         │                    │                │
        │  approve   submit              timeout             │
        │  /reject   /cancel             /retry              │
        │     │         │                    │                │
        │     ▼         ▼                    ▼                │
        │  RUNNING  RUNNING             ┌──────┐             │
        │     │         │               │TIME- │             │
        │     │    fail/timeout         │OUT   │             │
        │     │         │               └──┬───┘             │
        │     ▼         ▼                  │                 │
        │  ┌──────┐  ┌──────┐          retry                │
        │  │FAIL- │  │TIME- │             │                 │
        │  │ED    │  │OUT   │             │                 │
        │  └──┬───┘  └──┬───┘             │                 │
        │     │          │                 │                 │
        │   retry      retry               │                 │
        │     │          │                 │                 │
        │     ▼          ▼                 │                 │
        │  ┌──────────────────┐            │                 │
        └──│    RETRYING      │────────────┘                 │
           └──────────────────┘                              │
                    │                                        │
                 cancel                                      │
                    │                                        │
                    ▼                                        │
               CANCELLED ◄───────────────────────────────────┘
```

### Transition Table

| From | Valid Next States |
|------|-------------------|
| `pending` | `running`, `waiting_for_approval`, `cancelled`, `timeout` |
| `running` | `waiting_for_approval`, `waiting_for_user_input`, `completed`, `failed`, `cancelled`, `timeout` |
| `waiting_for_approval` | `running`, `cancelled`, `timeout` |
| `waiting_for_user_input` | `running`, `cancelled`, `timeout` |
| `completed` | *(terminal — no transitions)* |
| `failed` | `retrying` |
| `cancelled` | *(terminal — no transitions)* |
| `timeout` | `retrying` |
| `retrying` | `running`, `cancelled` |

### Invalid Transitions (Explicitly Blocked)

| From → To | Reason |
|-----------|--------|
| `completed` → anything | Terminal state |
| `cancelled` → anything | Terminal state |
| `pending` → `completed` | Must go through `running` first |
| `waiting_for_approval` → `completed` | Must be approved → running first |
| `running` → `pending` | No going backwards |

---

## 5. Sequence Diagrams

### Happy Path: Create Ticket

```
User        ChatPage      WebSocket     Backend       ToolRegistry    ToolSDK      CreateTicketTool
 │             │              │            │              │              │              │
 │ "create     │              │            │              │              │              │
 │  ticket"    │              │            │              │              │              │
 │────────────►│  sendMessage │            │              │              │              │
 │             │─────────────►│  chat      │              │              │              │
 │             │              │───────────►│              │              │              │
 │             │              │            │              │              │              │
 │             │              │  tool_start│              │              │              │
 │             │              │◄───────────│              │              │              │
 │             │  status:     │            │              │              │              │
 │             │  running     │            │              │              │              │
 │             │◄─────────────│            │              │              │              │
 │             │              │            │              │              │              │
 │             │              │  pause     │              │              │              │
 │             │              │◄───────────│              │              │              │
 │             │  status:     │            │              │              │              │
 │             │  waiting_for │            │              │              │              │
 │             │  _approval   │            │              │              │              │
 │             │◄─────────────│            │              │              │              │
 │             │              │            │              │              │              │
 │ Approve     │              │            │              │              │              │
 │────────────►│  confirmAction            │              │              │              │
 │             │─────────────►│  confirm   │              │              │              │
 │             │              │───────────►│              │              │              │
 │             │  status:     │            │              │              │              │
 │             │  running     │            │              │              │              │
 │             │              │            │              │              │              │
 │             │              │ show_tool_ui              │              │              │
 │             │              │◄───────────│              │              │              │
 │             │  activeTool  │            │              │              │              │
 │             │  set         │            │              │              │              │
 │             │◄─────────────│            │              │              │              │
 │             │              │            │  resolveTool │              │              │
 │             │  ToolRenderer│            │─────────────►│              │              │
 │             │─────────────────────────────────────────►│              │              │
 │             │              │            │              │  definition  │              │
 │             │              │            │◄─────────────│              │              │
 │             │              │            │              │              │              │
 │             │  ┌───────────┼────────────┼──────────────┼──────────────┼─────────────►│
 │             │  │ Suspense  │            │              │              │  useTool()   │
 │             │  │ loads     │            │              │              │◄─────────────│
 │             │  │ component │            │              │              │              │
 │             │  └───────────┼────────────┼──────────────┼──────────────┼──────────────│
 │             │              │            │              │              │              │
 │ Fill form   │              │            │              │              │              │
 │ Submit      │              │            │              │              │              │
 │─────────────────────────────────────────────────────────────────────────────────────►│
 │             │              │            │              │  validate()  │              │
 │             │              │            │              │◄─────────────│              │
 │             │              │            │              │  ✓ valid     │              │
 │             │              │            │              │─────────────►│              │
 │             │              │            │              │  complete()  │              │
 │             │              │            │  tool_result │              │              │
 │             │              │◄─────────────────────────────────────────│              │
 │             │              │───────────►│              │              │              │
 │             │  activeTool  │            │              │              │              │
 │             │  cleared     │            │              │              │              │
 │             │  status:     │            │              │              │              │
 │             │  running     │            │              │              │              │
 │             │              │            │              │              │              │
 │             │              │  tool_end  │              │              │              │
 │             │              │◄───────────│              │              │              │
 │             │  status:     │            │              │              │              │
 │             │  completed   │            │              │              │              │
 │             │◄─────────────│            │              │              │              │
```

### Unknown Tool Auto-Fail

```
Backend         Runtime           UnknownToolHandler
  │                │                    │
  │ show_tool_ui   │                    │
  │ (unknown_tool) │                    │
  │───────────────►│                    │
  │                │  resolveTool()     │
  │                │  → undefined       │
  │                │                    │
  │                │  render            │
  │                │───────────────────►│
  │                │                    │  useEffect:
  │                │                    │  sendResult(failed,
  │  tool_result   │                    │    'unsupported_tool')
  │  (failed)      │                    │
  │◄────────────────────────────────────│
  │                │                    │
  │                │  Show friendly UI  │
  │                │  "Tool not         │
  │                │   available"       │
```

---

## 6. Protocol Specification

### Frontend → Backend

#### `tool_result`

```json
{
  "type": "tool_result",
  "tool_call_id": "tc-001",
  "status": "success",
  "payload": {
    "ticketId": 52,
    "subject": "Login issue",
    "priority": "high"
  }
}
```

```json
{
  "type": "tool_result",
  "tool_call_id": "tc-001",
  "status": "cancelled"
}
```

```json
{
  "type": "tool_result",
  "tool_call_id": "tc-001",
  "status": "failed",
  "payload": { "error": "Validation failed" },
  "reason": "validation_failed"
}
```

**Reason codes**: `unsupported_tool`, `validation_failed`, `tool_error`, `tool_crash`, `api_error`, `timeout`

#### `confirm` (approval)

```json
{ "type": "confirm", "approved": true }
```

### Backend → Frontend

| Event | Payload | Purpose |
|-------|---------|---------|
| `tool_start` | `{ tool_call_id, name, input }` | Tool execution begins |
| `pause` | `{ tool_call_id, action_name, params }` | Human approval required |
| `show_tool_ui` / `show_ticket_dialogue` / `tool_input_required` | `{ tool_call_id, action_name, version?, params, schema? }` | Show interactive tool UI |
| `tool_end` | `{ tool_call_id, name, status?, output }` | Tool execution finished |
| `done` | — | AI response complete |

### Future Events (Designed, Not Yet Implemented)

| Event | Purpose |
|-------|---------|
| `tool_progress` | Tool reports progress (0-100%) |
| `tool_log` | Tool logs a message |
| `tool_warning` | Non-fatal warning from tool |
| `tool_retry` | Tool is retrying after failure |
| `tool_timeout` | Tool timed out |

---

## 7. Tool SDK API

### `useTool()` — The Complete API

```typescript
const tool = useTool()

// ---- Identity ----
tool.toolCallId    // string — server-provided ID
tool.actionName    // string — e.g., 'create_ticket'
tool.version       // string — e.g., 'v1'
tool.params        // Record<string, unknown> — backend parameters
tool.conversationId // string | null

// ---- Metadata ----
tool.metadata      // Full ToolMetadata object
  .definition      // HumanToolDefinition
  .executionId     // string | undefined
  .tenantId        // string | undefined
  .backendContext  // Record<string, unknown> | undefined

// ---- Results ----
tool.complete(payload?)     // Send success result (validates first)
tool.cancel()               // Send cancelled result
tool.fail(error, reason?)   // Send failed result

// ---- Progress & Logging ----
tool.progress(percent, message?)  // Report progress (0-100)
tool.log(message, level?)         // Log (info/warn/error)

// ---- UI State ----
tool.isBusy        // boolean — whether tool is submitting
tool.setBusy()     // Disable UI
tool.setIdle()     // Enable UI

// ---- Validation ----
tool.validate(payload)  // Validate against schema/validator
```

### Example: Using the SDK

```typescript
function MyTool() {
  const tool = useTool()
  
  const handleSubmit = async () => {
    tool.setBusy()
    tool.log('Processing started')
    tool.progress(30, 'Uploading...')
    
    try {
      const result = await apiCall(tool.params)
      tool.progress(100, 'Done!')
      tool.complete(result)  // Validates payload automatically
    } catch (err) {
      tool.setIdle()
      tool.fail(err.message, 'api_error')
    }
  }
  
  return (
    <div>
      <button onClick={handleSubmit} disabled={tool.isBusy}>
        {tool.isBusy ? 'Processing...' : 'Submit'}
      </button>
      <button onClick={() => tool.cancel()} disabled={tool.isBusy}>
        Cancel
      </button>
    </div>
  )
}
```

---

## 8. Registry API

```typescript
// Register a tool
registerTool(definition, { isDefault: true })

// Unregister a tool
unregisterTool('create_ticket', 'v1')

// Resolve a tool (with versioning + fuzzy matching)
resolveTool('create_ticket')        // → default version
resolveTool('create_ticket@v2')     // → specific version
resolveTool('create_tic')           // → fuzzy match

// Query the registry
isRegistered('create_ticket')       // → boolean
getAllVersions('create_ticket')     // → ['v1', 'v2']
getAllTypes()                       // → ['create_ticket', 'select_product', ...]
getAllTools()                       // → HumanToolDefinition[]
getRegistryStats()                  // → { totalTools, totalTypes, types }

// Testing
clearRegistry()                     // Clear all (for tests)
```

---

## 9. Plugin API

### Registering a Plugin

```typescript
import { registerPlugin, defineTool } from '@/features/chat/tools'

// Define a tool
const myTool = defineTool({
  type: 'my_custom_tool',
  label: 'My Custom Tool',
  description: 'Does something useful',
  Component: lazy(() => import('./MyCustomTool')),
  schema: { fields: [...] },
  permissions: ['custom:execute'],
  capabilities: ['progress', 'logging'],
  supportsResume: true,
  timeoutMs: 300000,
})

// Register as a plugin
registerPlugin({
  name: 'my-plugin',
  version: '1.0.0',
  tools: [myTool],
  setup: async () => {
    console.log('Plugin initialized')
  },
})
```

### Adding a New Tool (3 Steps)

```
Step 1: Create component
  src/features/chat/tools/my-tool/MyTool.tsx
  → Uses useTool() SDK

Step 2: Create definition
  src/features/chat/tools/my-tool/definition.ts
  → Lazy import + metadata + schema

Step 3: Register in index.ts
  import { myToolDefinition } from './my-tool/definition'
  registerTool(myToolDefinition, { isDefault: true })
```

**No changes to ChatPage, useChatWebSocket, ToolRenderer, or any other infrastructure file.**

---

## 10. Testing Strategy

### Test Coverage (51 tests, all passing)

| Category | Tests | Description |
|----------|-------|-------------|
| Registry Resolution | 8 | Exact, versioned, fuzzy, unknown, multi-version |
| State Machine | 22 | All valid + invalid transitions, terminal states |
| Full Lifecycle | 2 | Happy path + decline path |
| Validation | 6 | Required, min length, enum, optional fields |
| Unknown Tool | 2 | Resolution + auto-fail behavior |
| Duplicate Prevention | 2 | With and without isBusy guard |
| Error Recovery | 3 | Disconnect, reconnect, state preservation |
| Version Resolution | 3 | v1, v2, default |
| Plugin Registration | 3 | Register, resolve, query |

### Running Tests

```bash
node simulation/architecture_tests.mjs
```

### Future: Unit Tests with Vitest

```typescript
// tests/tools/registry.test.ts
describe('Registry', () => {
  beforeEach(() => clearRegistry())
  
  it('resolves default version', () => {
    registerTool({ type: 'test', version: 'v1', ... })
    registerTool({ type: 'test', version: 'v2', ... }, { isDefault: true })
    expect(resolveTool('test')?.version).toBe('v2')
  })
  
  it('resolves explicit version', () => {
    registerTool({ type: 'test', version: 'v1', ... })
    expect(resolveTool('test@v1')?.version).toBe('v1')
  })
})

// tests/tools/lifecycle.test.ts
describe('Lifecycle', () => {
  it('allows valid transitions', () => {
    expect(isValidTransition('running', 'completed')).toBe(true)
  })
  
  it('blocks invalid transitions', () => {
    expect(isValidTransition('completed', 'running')).toBe(false)
  })
})

// tests/tools/validation.test.ts
describe('Validation', () => {
  it('validates required fields', () => {
    const result = validatePayload({}, schema)
    expect(result.valid).toBe(false)
    expect(result.errors?.[0]?.code).toBe('required')
  })
})
```

---

## 11. Remaining Limitations

| Limitation | Severity | Mitigation |
|-----------|----------|------------|
| Schema-driven dynamic forms not yet implemented | Low | Tools currently hardcode their forms; future `DynamicFormRenderer` can consume `ToolSchema` |
| `tool_progress` and `tool_log` events not yet sent to backend | Low | Transport interface supports them; backend needs to handle them |
| No offline queue for `tool_result` | Low | If WebSocket disconnects during `complete()`, result is lost; future: queue + retry |
| No tool-level timeout enforcement | Low | `timeoutMs` is defined in metadata but not enforced by runtime; future: timer in `ToolRenderer` |
| No A/B testing support for tool versions | Low | Registry supports versions but no traffic splitting |
| No tool analytics/telemetry | Low | Future: track tool usage, completion rates, average time |

---

## 12. Future Improvements

### Near-term

1. **Dynamic Form Renderer** — Consume `ToolSchema` to auto-generate forms without custom components
2. **Offline Queue** — Queue `tool_result` messages during disconnect, send on reconnect
3. **Tool Timeout Enforcement** — Timer in `ToolRenderer` that auto-cancels after `timeoutMs`
4. **Tool Analytics** — Track usage metrics, completion rates, error rates

### Medium-term

5. **Remote Registry** — Fetch tool definitions from an API at runtime (no deploy needed for new tools)
6. **Tool Marketplace** — Third-party tool plugins loaded dynamically
7. **Tool Permissions Gateway** — Check user permissions before rendering a tool
8. **Tool Versioning UI** — Show version badge, allow switching versions

### Long-term

9. **Tool Composition** — Chain multiple tools in a workflow
10. **Tool State Persistence** — Persist tool state across page refreshes
11. **Server-Side Rendering** — Pre-render tool UIs on the server
12. **Native Mobile Tools** — Platform-specific tool implementations

### Scaffolding CLI (Future)

```bash
npx generate-human-tool calendar-picker \
  --fields "date:date, time:time, timezone:enum" \
  --permissions "calendar:read" \
  --capabilities "progress"
```

Would generate:
```
tools/calendar-picker/
├── CalendarPickerTool.tsx    # Component skeleton using useTool()
├── definition.ts             # Definition with schema + metadata
├── CalendarPickerTool.test.tsx # Test skeleton
└── index.ts                  # Barrel export
```

Plus automatically adds the registration to `tools/index.ts`.
