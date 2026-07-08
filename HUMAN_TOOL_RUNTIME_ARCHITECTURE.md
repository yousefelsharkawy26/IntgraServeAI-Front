# Human Tool Runtime — Architecture Documentation

## 1. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Agent Runtime)                     │
│                                                                     │
│  tool_start ──► pause ──► [waits for confirm] ──► show_tool_ui     │
│       ▲                                              │              │
│       │                                        [waits for           │
│       │                                         tool_result]        │
│       │                                              │              │
│  tool_end ◄────── [resumes execution] ◄──────────────┘              │
│                                                                     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ WebSocket
┌───────────────────────────▼─────────────────────────────────────────┐
│                         FRONTEND                                    │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │ useChatWebSocket  │───►│   ChatPage        │───►│ ToolRenderer  │  │
│  │                   │    │                   │    │               │  │
│  │ • activeTool      │    │ • Renders msgs    │    │ • Registry    │  │
│  │ • sendToolResult  │    │ • Renders tools   │    │ • Context     │  │
│  │ • confirmAction   │    │ • NO tool logic   │    │ • Component   │  │
│  └──────────────────┘    └──────────────────┘    └───────┬───────┘  │
│                                                           │         │
│  ┌────────────────────────────────────────────────────────▼──────┐  │
│  │                    TOOL REGISTRY                               │  │
│  │                                                                │  │
│  │  create_technical_ticket ──► CreateTicketTool                  │  │
│  │  create_support_ticket   ──► CreateTicketTool                  │  │
│  │  select_product          ──► SelectProductTool                 │  │
│  │  upload_attachment       ──► (future)                          │  │
│  │  select_customer         ──► (future)                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    TOOL CONTEXT                                 │  │
│  │                                                                │  │
│  │  toolCallId    actionName    params    conversationId          │  │
│  │  sendResult()  cancel()      fail()                            │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Sequence Diagram

```
User          ChatPage       useChatWebSocket     Backend        Tool Component
 │               │                │                 │                │
 │  "create      │                │                 │                │
 │   ticket"     │                │                 │                │
 │──────────────►│                │                 │                │
 │               │  sendMessage() │                 │                │
 │               │───────────────►│  {type:'chat'}  │                │
 │               │                │────────────────►│                │
 │               │                │                 │                │
 │               │                │  tool_start     │                │
 │               │                │◄────────────────│                │
 │               │  ToolCard      │                 │                │
 │               │  (RUNNING)     │                 │                │
 │               │◄───────────────│                 │                │
 │               │                │                 │                │
 │               │                │  pause          │                │
 │               │                │◄────────────────│                │
 │               │  Approval      │                 │                │
 │               │  Card          │                 │                │
 │               │  (WAITING)     │                 │                │
 │               │◄───────────────│                 │                │
 │               │                │                 │                │
 │  Approve      │                │                 │                │
 │──────────────►│  confirmAction │                 │                │
 │               │───────────────►│  {type:'confirm'}               │
 │               │                │────────────────►│                │
 │               │                │                 │                │
 │               │                │  show_tool_ui   │                │
 │               │                │◄────────────────│                │
 │               │  activeTool    │                 │                │
 │               │  set           │                 │                │
 │               │◄───────────────│                 │                │
 │               │                │                 │                │
 │               │  ToolRenderer  │                 │                │
 │               │  looks up      │                 │                │
 │               │  registry      │                 │                │
 │               │                │                 │                │
 │               │  Renders       │                 │  CreateTicket  │
 │               │  ─────────────────────────────────────────────►Tool│
 │               │                │                 │                │
 │  Fill form    │                │                 │                │
 │  Submit       │                │                 │                │
 │──────────────────────────────────────────────────────────────────►│
 │               │                │                 │   sendResult() │
 │               │                │  tool_result    │◄───────────────│
 │               │                │◄────────────────│                │
 │               │                │  {type:         │                │
 │               │  activeTool    │   'tool_result'}│                │
 │               │  cleared       │────────────────►│                │
 │               │◄───────────────│                 │                │
 │               │                │                 │  [resumes      │
 │               │                │                 │   execution]   │
 │               │                │                 │                │
 │               │                │  tool_end       │                │
 │               │                │◄────────────────│                │
 │               │  ToolCard      │  (status from   │                │
 │               │  (COMPLETED)   │   backend)      │                │
 │               │◄───────────────│                 │                │
 │               │                │                 │                │
 │               │                │  done           │                │
 │               │                │◄────────────────│                │
```

## 3. Files Added

| File | Purpose |
|------|---------|
| `src/features/chat/tools/types.ts` | `ToolResult`, `ActiveTool`, `HumanToolDefinition`, `ToolContextValue` |
| `src/features/chat/tools/registry.ts` | Tool registry mapping `action_name` → component definition |
| `src/features/chat/tools/ToolContext.ts` | React context + `useToolContext()` hook |
| `src/features/chat/tools/ToolRenderer.tsx` | Generic renderer with unknown-tool fallback |
| `src/features/chat/tools/index.ts` | Barrel exports |
| `src/features/chat/tools/create-ticket/CreateTicketTool.tsx` | Ticket creation tool |
| `src/features/chat/tools/select-product/SelectProductTool.tsx` | Mock product picker tool |

## 4. Files Modified

| File | Changes |
|------|---------|
| `src/features/chat/hooks/useChatWebSocket.ts` | Complete rewrite: `activeTool` state, `sendToolResult()`, generic `show_tool_ui` handler, removed `completeToolCall` from public API |
| `src/features/chat/components/ChatPage.tsx` | Removed `isCreateTicketModalOpen`, `CreateTicketModal` import; added `<ToolRenderer>` |

## 5. Backend Protocol (Frontend → Backend)

### `tool_result`

Sent when a human-interactive tool completes user interaction.

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
  "payload": { "error": "Validation failed" }
}
```

## 6. Frontend Protocol (Backend → Frontend)

| Event | Purpose | Payload |
|-------|---------|---------|
| `tool_start` | Tool execution begins | `{ tool_call_id, name, input }` |
| `pause` | Human approval required | `{ tool_call_id, action_name, params }` |
| `show_tool_ui` / `show_ticket_dialogue` / `tool_input_required` | Show interactive tool UI | `{ tool_call_id, action_name, params }` |
| `tool_end` | Tool execution finished | `{ tool_call_id, name, status, output }` |
| `done` | AI response complete | — |

## 7. Tool Lifecycle State Machine

```
                    tool_start
                        │
                        ▼
                  ┌───────────┐
                  │  RUNNING   │
                  └─────┬─────┘
                        │
                   ┌────┴────┐
                   │         │
              pause │         │ (no pause)
                   ▼         │
        ┌──────────────────┐  │
        │ WAITING_FOR_     │  │
        │ APPROVAL         │  │
        └────────┬─────────┘  │
                 │            │
          ┌──────┴──────┐     │
          │             │     │
       approve      decline   │
          │             │     │
          ▼             ▼     │
       RUNNING     CANCELLED  │
          │                   │
          ├───────────────────┘
          │
     show_tool_ui
          │
          ▼
   ┌──────────────────┐
   │ WAITING_FOR_     │
   │ USER_INPUT       │
   └────────┬─────────┘
            │
     ┌──────┴──────┐
     │             │
  submit       cancel
     │             │
     ▼             ▼
  RUNNING     CANCELLED
     │
  tool_end
     │
     ▼
  ┌──────────┐
  │ COMPLETED│  (or FAILED, per backend status)
  └──────────┘
```

**Only backend events (`tool_end`, `done`) may move a tool into a terminal state.**

## 8. Registry Implementation

```typescript
// src/features/chat/tools/registry.ts

export const toolRegistry: ToolRegistry = {
  create_technical_ticket: {
    type: 'create_technical_ticket',
    label: 'Create Technical Ticket',
    Component: CreateTicketTool,
  },
  create_support_ticket: {
    type: 'create_support_ticket',
    label: 'Create Support Ticket',
    Component: CreateTicketTool,
  },
  select_product: {
    type: 'select_product',
    label: 'Select Product',
    Component: SelectProductTool,
  },
  // Add new tools here — no chat modifications needed
}
```

## 9. Renderer Implementation

```typescript
// src/features/chat/tools/ToolRenderer.tsx

export function ToolRenderer({ activeTool, conversationId, onResult }) {
  const contextValue = useMemo(() => ({
    toolCallId: activeTool.toolCallId,
    actionName: activeTool.actionName,
    params: activeTool.params,
    conversationId,
    sendResult: (payload) => onResult(activeTool.toolCallId, 'success', payload),
    cancel: () => onResult(activeTool.toolCallId, 'cancelled'),
    fail: (error) => onResult(activeTool.toolCallId, 'failed', { error }),
  }), [activeTool, conversationId, onResult])

  const definition = getToolDefinition(activeTool.actionName)

  return (
    <ToolContext.Provider value={contextValue}>
      {definition ? <definition.Component /> : <UnknownToolFallback />}
    </ToolContext.Provider>
  )
}
```

## 10. Example: Create Ticket Tool

```typescript
// src/features/chat/tools/create-ticket/CreateTicketTool.tsx

export function CreateTicketTool() {
  const { toolCallId, params, sendResult, cancel } = useToolContext()
  const { createTicket } = useTicketMutations()

  const handleSubmit = (data) => {
    createTicket.mutate(data, {
      onSuccess: (newTicket) => {
        // Report result to backend — backend owns lifecycle
        sendResult({ ticketId: newTicket.id, ...data })
      },
    })
  }

  return <Form onSubmit={handleSubmit} onCancel={cancel} />
}
```

## 11. Example: Select Product Tool

```typescript
// src/features/chat/tools/select-product/SelectProductTool.tsx

export function SelectProductTool() {
  const { sendResult, cancel } = useToolContext()
  const [selectedId, setSelectedId] = useState(null)

  const handleConfirm = () => {
    const product = PRODUCTS.find(p => p.id === selectedId)
    sendResult({ productId: product.id, productName: product.name })
  }

  return <ProductList onSelect={setSelectedId} onConfirm={handleConfirm} onCancel={cancel} />
}
```

## 12. Proof: Adding a New Tool Requires Only Registration

To add an `UploadAttachmentTool`:

### Step 1: Create the component

```typescript
// src/features/chat/tools/upload-file/UploadFileTool.tsx
export function UploadFileTool() {
  const { sendResult, cancel } = useToolContext()

  const handleUpload = async (file: File) => {
    const url = await uploadToServer(file)
    sendResult({ fileUrl: url, fileName: file.name })
  }

  return <FilePicker onUpload={handleUpload} onCancel={cancel} />
}
```

### Step 2: Register it

```typescript
// src/features/chat/tools/registry.ts
import { UploadFileTool } from './upload-file/UploadFileTool'

export const toolRegistry: ToolRegistry = {
  // ... existing tools
  upload_attachment: {
    type: 'upload_attachment',
    label: 'Upload Attachment',
    Component: UploadFileTool,
  },
}
```

### That's it.

- No changes to `useChatWebSocket.ts`
- No changes to `ChatPage.tsx`
- No changes to `ToolRenderer.tsx`
- No changes to `ToolContext.ts`
- The chat infrastructure doesn't know this tool exists

## Summary

| Before | After |
|--------|-------|
| `if (tool === 'create_ticket')` | Registry lookup |
| `onTicketCreated()` callback | `sendResult(payload)` |
| `onProductSelected()` callback | `sendResult(payload)` |
| Frontend decides `completed` | Backend sends `tool_end(status)` |
| `completeToolCall()` | `sendToolResult()` (sends to backend) |
| Tool-specific modals in ChatPage | Single `<ToolRenderer>` |
| Adding a tool = modify chat | Adding a tool = register component |

**The chat knows nothing about individual tools. The only contract is: `tool_start` → `pause` → `tool_result` → `tool_end`.**
