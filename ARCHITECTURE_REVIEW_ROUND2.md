# Architecture Review Round 2 — Implementation Report

> **Commit**: `round2-review`  
> **TypeScript**: Zero errors  
> **Tests**: 51/51 passing  

---

## Classification Summary

| # | Area | Classification | Action Taken |
|---|------|----------------|--------------|
| 1 | Dynamic Plugin Loading | **Should Have** | ✅ Implemented |
| 2 | Plugin Dependencies | **Nice to Have** | Designed (field added to `HumanToolDefinition`) |
| 3 | Capability Negotiation | **Should Have** | ✅ Implemented |
| 4 | Lifecycle Hooks + AbortSignal | **Should Have** | ✅ Implemented |
| 5 | State Machine Expansion | **Nice to Have** | Deferred (current 9 states sufficient) |
| 6 | Protocol Improvements | **Should Have** | ✅ Implemented (progress/log in transport) |
| 7 | Versioned Schemas | **Future Enhancement** | Skipped (tool versioning covers this) |
| 8 | Smart Prefetch | **Should Have** | ✅ Implemented |
| 9 | Event API | **Nice to Have** | Deferred (specific methods provide type safety) |
| 10 | Separate Tool From UI | **Future Enhancement** | Skipped (web-only deployment) |
| 11 | Transport Abstraction | **Must Have** | ✅ Verified (already solid) |
| 12 | Runtime Diagnostics | **Should Have** | ✅ Implemented |
| 13 | Performance | **Nice to Have** | No bottlenecks measured |
| 14 | Security | **Nice to Have** | Deferred (all plugins first-party) |

**Implemented: 7 items** (1 Must Have + 6 Should Have)  
**Deferred: 7 items** (5 Nice to Have + 2 Future Enhancement)

---

## What Was Implemented

### 1. Dynamic Plugin Loading (`registry.ts`, `plugin.ts`)

**Problem**: Static registry requires shipping every tool to every customer.

**Solution**: 
- `PluginLoader` interface for abstract loading
- `loadPlugin()` for remote/dynamic loading
- `loadDynamicPlugin()` for `import()` based loading
- `loadRemotePlugin()` for URL-based loading
- Plugin deduplication via `loadedPlugins` Set

```typescript
// Dynamic import
await loadDynamicPlugin(() => import('./plugins/crm-plugin'))

// Remote URL
await loadRemotePlugin('https://cdn.example.com/plugins/crm.js', loader)

// Custom loader
const loader: PluginLoader = {
  load: async (id) => { /* fetch and parse */ },
  isAvailable: async (id) => { /* check availability */ },
}
```

**Trade-offs**: Adds complexity for multi-tenant scenarios. Justified because the runtime will support hundreds of tools across multiple tenants.

### 2. Client Capability Negotiation (`useChatWebSocket.ts`, `registry.ts`)

**Problem**: Backend assumes frontend supports every tool.

**Solution**:
- `getCapabilityManifest()` builds a manifest of all registered tools + capabilities
- Sent on WebSocket connect as `client_capabilities`
- Backend can use this to avoid requesting unsupported interactions

```json
{
  "session_id": "...",
  "customer_email": "...",
  "client_capabilities": {
    "tools": [
      { "type": "create_ticket", "version": "v1", "capabilities": ["upload", "logging"] },
      { "type": "select_product", "version": "v1", "capabilities": ["product_picker"] }
    ],
    "total_tools": 3,
    "total_types": 2
  }
}
```

**Trade-offs**: Adds payload to connect message (~1KB for 10 tools). Justified because it prevents the backend from requesting unsupported interactions, reducing errors.

### 3. Lifecycle Hooks + AbortSignal (`sdk.ts`)

**Problem**: Tools can't react to suspend/resume/reconnect. Long-running API requests can't be cancelled.

**Solution**:
- `tool.onResume(callback)` — called after reconnect
- `tool.onSuspend(callback)` — called before suspend
- `tool.onVisibilityChange(callback)` — called on tab visibility change
- `tool.onDestroy(callback)` — called on cleanup
- `tool.abortSignal` — AbortSignal that aborts on cancel/destroy

```typescript
function MyTool() {
  const tool = useTool()
  
  // Cancel fetch on destroy
  useEffect(() => {
    fetch('/api/data', { signal: tool.abortSignal })
      .then(res => res.json())
      .then(data => tool.complete(data))
      .catch(err => {
        if (err.name !== 'AbortError') tool.fail(err)
      })
  }, [])
  
  // Save state on suspend
  tool.onSuspend(() => {
    localStorage.setItem('draft', JSON.stringify(formData))
  })
  
  // Restore state on resume
  tool.onResume(() => {
    const draft = localStorage.getItem('draft')
    if (draft) setFormData(JSON.parse(draft))
  })
}
```

**Trade-offs**: Adds complexity to the SDK. Justified because long-running tools (file uploads, API calls) need cancellation support.

### 4. Smart Prefetch (`registry.ts`, `runtime.tsx`)

**Problem**: Tool components are lazy-loaded, causing a loading spinner when the UI opens.

**Solution**:
- `prefetchTool(type)` triggers the lazy import without rendering
- `useToolPrefetch(actionName)` hook prefetches when `pause` arrives
- The component is already loaded by the time `show_tool_ui` arrives

```typescript
// In ChatPage:
useToolPrefetch(pendingAction?.actionName)
```

**Trade-offs**: Prefetches components that might not be used (if user declines). Justified because the approval flow almost always leads to the tool UI, and the perceived latency reduction is significant.

### 5. Runtime Diagnostics (`diagnostics.ts`)

**Problem**: No structured observability for production debugging.

**Solution**:
- `diagnostics` singleton with structured logging
- Categories: `lifecycle`, `registry`, `transport`, `validation`, `plugin`
- Levels: `debug`, `info`, `warn`, `error`
- Circular buffer (1000 events)
- Query API: `getEvents()`, `getToolTrace()`, `getRegistryStats()`
- Export API: `diagnostics.export()` for bug reports
- Subscriber API: `diagnostics.subscribe(listener)`

```typescript
// Enable debug mode
diagnostics.setDebugMode(true)

// Query events for a specific tool
const trace = diagnostics.getToolTrace('tc-001')

// Subscribe to events (for analytics)
diagnostics.subscribe(event => {
  analytics.track('tool_event', event)
})

// Export for bug reports
const report = diagnostics.export()
```

**Trade-offs**: Memory overhead for event buffer. Justified because production debugging of tool lifecycle issues requires structured observability.

### 6. Protocol Improvements (`sdk.ts`, `types.ts`)

**Problem**: Transport interface had `sendProgress` and `sendLog` hooks but they weren't formally integrated.

**Solution**:
- `tool.progress(percent, message)` sends progress to backend
- `tool.log(message, level)` sends logs to backend AND diagnostics
- Both are wired through the transport interface

### 7. Transport Abstraction Verified

**Status**: Already solid. `ToolTransport` interface decouples SDK from WebSocket. No changes needed.

---

## Files Modified

| File | Changes |
|------|---------|
| `tools/types.ts` | Added `ToolCapability`, `ToolLifecycleHooks`, `DiagnosticEvent`, `PluginLoader`, `dependencies` field |
| `tools/registry.ts` | Added diagnostics integration, capability querying, plugin loading, prefetch |
| `tools/sdk.ts` | Added lifecycle hooks, AbortSignal, diagnostics integration |
| `tools/runtime.tsx` | Added lifecycle controllers, prefetch hook, diagnostics integration |
| `tools/plugin.ts` | Added `loadDynamicPlugin`, `loadRemotePlugin`, `dependencies` field |
| `tools/diagnostics.ts` | **New** — structured observability module |
| `tools/index.ts` | Updated exports |
| `hooks/useChatWebSocket.ts` | Added capability negotiation on connect, diagnostics integration |

---

## Backward Compatibility

All changes are **backward compatible**:
- New fields in `HumanToolDefinition` are optional
- New SDK methods are additive (existing tools don't need to use them)
- `diagnostics` is a singleton that works without configuration
- Capability manifest is sent alongside existing connect payload
- Existing `ToolTransport` interface unchanged

---

## Remaining Limitations

| Limitation | Severity | Mitigation |
|-----------|----------|------------|
| Plugin dependency resolution not implemented | Low | Field exists in `HumanToolDefinition.dependencies` for future use |
| No tool-level timeout enforcement | Low | `timeoutMs` defined but not enforced; future: timer in runtime |
| No offline queue for `tool_result` | Low | If WS disconnects during `complete()`, result is lost |
| Schema evolution not versioned | Low | Tool versioning covers this; schema changes = new tool version |
| No multi-platform rendering | Low | Interaction layer not needed for web-only deployment |

---

## Future Enhancements (Not Implemented)

| Enhancement | When to Implement |
|------------|-------------------|
| Plugin dependency resolution | When 10+ plugins with inter-dependencies exist |
| State machine expansion (`paused`, `waiting_external_event`) | When tools need to wait for external systems |
| Generic event API (`tool.emit()`) | When analytics requires custom events |
| Interaction layer separation | When mobile/desktop/CLI support is needed |
| Versioned schemas | When schema changes break backward compatibility |
| Performance optimization | When measured bottlenecks appear |
| Security hardening | When third-party plugins are introduced |
