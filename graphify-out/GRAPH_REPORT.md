# Graph Report - Frontend  (2026-07-10)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1398 nodes · 3018 edges · 81 communities (78 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.66)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- dependencies
- react
- cn
- sidebar.tsx
- run_simulation.mjs
- role.service.ts
- actionSchema.ts
- ProfileView.tsx
- index.ts
- types.ts
- devDependencies
- run_fixed_simulation.mjs
- index.ts
- ChatWidget.tsx
- button.tsx
- input.tsx
- utils.ts
- BackupsView.tsx
- action.ts
- alert-dialog.tsx
- architecture_tests.mjs
- compilerOptions
- command.tsx
- TicketQueue.tsx
- useNotificationStore
- DashboardView.tsx
- runtime.tsx
- compilerOptions
- components.json
- field.tsx
- auth.ts
- ChatPage.tsx
- ticket.ts
- UsersList.tsx
- menubar.tsx
- useChatWebSocket.ts
- context-menu.tsx
- dropdown-menu.tsx
- RuntimeDiagnostics
- dashboard.ts
- tool_lifecycle_bug.mjs
- UsersTable.tsx
- ActionsList.tsx
- ActionModal.tsx
- sdk.ts
- ChatSidebar.tsx
- registry.ts
- User
- index.tsx
- NotificationCenter.tsx
- item.tsx
- tool_lifecycle_fixed.mjs
- ChatMarkdown.tsx
- plugin.ts
- drawer.tsx
- UserFormModal.tsx
- user.service.ts
- main.tsx
- Sidebar.tsx
- useAuthStore
- TicketDetail.tsx
- backup.service.ts
- ErrorBoundary
- empty.tsx
- MetricCard.tsx
- toggle-group.tsx
- RevealCard.tsx
- tsconfig.json
- alert.tsx
- sonner
- routes.ts
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `cn()` - 299 edges
2. `Button()` - 35 edges
3. `Input()` - 25 edges
4. `useNotificationStore` - 25 edges
5. `Label()` - 22 edges
6. `compilerOptions` - 21 edges
7. `User` - 20 edges
8. `QUERY_KEYS` - 19 edges
9. `react` - 18 edges
10. `compilerOptions` - 18 edges

## Surprising Connections (you probably didn't know these)
- `CalendarDayButton()` --references--> `react`  [EXTRACTED]
  src/components/ui/calendar.tsx → package.json
- `InputOTPSlot()` --references--> `react`  [EXTRACTED]
  src/components/ui/input-otp.tsx → package.json
- `SidebarMenuSkeleton()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json
- `SidebarProvider()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json
- `useSidebar()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json

## Import Cycles
- None detected.

## Communities (81 total, 3 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.04
Nodes (55): dependencies, axios, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion (+47 more)

### Community 1 - "react"
Cohesion: 0.06
Nodes (45): react, Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext() (+37 more)

### Community 2 - "cn"
Cohesion: 0.07
Nodes (41): AccordionContent(), AccordionItem(), AccordionTrigger(), Avatar(), AvatarFallback(), AvatarImage(), BreadcrumbEllipsis(), BreadcrumbItem() (+33 more)

### Community 3 - "sidebar.tsx"
Cohesion: 0.06
Nodes (40): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle(), Sidebar() (+32 more)

### Community 4 - "run_simulation.mjs"
Cohesion: 0.06
Nodes (29): aiBufferRef, aiMsgIdRef, confirmAction(), confirmSends, connectionStatus, currentToolCallRef, generateId(), handleWsMessage() (+21 more)

### Community 5 - "role.service.ts"
Cohesion: 0.09
Nodes (26): getUserDisplayName(), getUserEmail(), getUserInitial(), RoleMembersModalContent(), RoleMembersModalProps, unwrapUsers(), RolesGrid(), NOTE: useCreateRole / useUpdateRole / useDeleteRole were previously defined (+18 more)

### Community 6 - "actionSchema.ts"
Cohesion: 0.08
Nodes (32): actionToFormData(), buildCreatePayload(), buildResponseConfig(), defaultResponseConfig(), headersToDict(), parametersToDict(), responseValuesToBackend(), actionParameterSchema (+24 more)

### Community 7 - "ProfileView.tsx"
Cohesion: 0.11
Nodes (20): QUERY_KEYS, useActionDetail(), useBackupDetail(), UseBackupsParams, ChangePasswordModal(), ChangePasswordModalProps, PasswordFormData, passwordSchema (+12 more)

### Community 8 - "index.ts"
Cohesion: 0.14
Nodes (25): createSupportTicketDefinition, createTechnicalTicketDefinition, CreateTicketTool, schema, EVENT_TO_TRANSITION, getNextStates(), isTerminal(), isValidTransition() (+17 more)

### Community 9 - "types.ts"
Cohesion: 0.09
Nodes (26): Table(), ChatAttachmentCard, ChatAttachmentCardProps, getFileConfig(), getIconComponent(), ImagePreviewModal, ImagePreviewModalProps, PendingFileChip (+18 more)

### Community 10 - "devDependencies"
Cohesion: 0.07
Nodes (28): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+20 more)

### Community 11 - "run_fixed_simulation.mjs"
Cohesion: 0.08
Nodes (21): aiBufferRef, aiMsgIdRef, confirmAction(), confirmSentRef, connectionStatus, currentToolCallRef, generateId(), handleWsMessage() (+13 more)

### Community 12 - "index.ts"
Cohesion: 0.11
Nodes (25): MessageSkeleton, MessageSkeletonProps, Shimmer, ShimmerProps, StreamingCursor, StreamingCursorProps, ThinkingDots, ThinkingDotsProps (+17 more)

### Community 13 - "ChatWidget.tsx"
Cohesion: 0.09
Nodes (23): ChatAvatar, ChatAvatarProps, senderConfig, sizeMap, StatusBadge, StatusBadgeProps, AIMessage, AIMessageProps (+15 more)

### Community 14 - "button.tsx"
Cohesion: 0.11
Nodes (16): Button(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, Textarea(), ForgotFormData, forgotSchema (+8 more)

### Community 15 - "input.tsx"
Cohesion: 0.32
Nodes (13): Input(), Label(), Select(), SelectContent(), SelectItem(), SelectTrigger(), SelectValue(), ParameterFields() (+5 more)

### Community 16 - "utils.ts"
Cohesion: 0.08
Nodes (11): input-otp, HoverCardContent(), InputOTP(), InputOTPGroup(), InputOTPSlot(), PopoverContent(), Progress(), ResizableHandle() (+3 more)

### Community 17 - "BackupsView.tsx"
Cohesion: 0.10
Nodes (16): EmptyState(), EmptyStateProps, buildPageList(), Pagination(), PaginationProps, BackupChange, BackupCompare, BackupListItem() (+8 more)

### Community 18 - "action.ts"
Cohesion: 0.12
Nodes (22): ActionModalProps, headersFromDict(), parametersFromDict(), mapBackendActionToFrontend(), actionService, Action, ActionFilters, ActionHeaders (+14 more)

### Community 19 - "alert-dialog.tsx"
Cohesion: 0.10
Nodes (18): AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay(), AlertDialogTitle() (+10 more)

### Community 20 - "architecture_tests.mjs"
Cohesion: 0.09
Nodes (16): activeTool, badEnum, declineTransitions, defaultVersions, emptyOptional, getAllVersions(), missingRequired, mockTransport (+8 more)

### Community 21 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+15 more)

### Community 22 - "command.tsx"
Cohesion: 0.12
Nodes (15): Command(), CommandDialog(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator(), CommandShortcut() (+7 more)

### Community 23 - "TicketQueue.tsx"
Cohesion: 0.19
Nodes (16): PriorityBadge(), PriorityBadgeProps, FALLBACK_CONFIG, StatusBadge(), StatusBadgeProps, KANBAN_COLUMNS, TICKET_PRIORITIES, TICKET_PRIORITY_CONFIG (+8 more)

### Community 24 - "useNotificationStore"
Cohesion: 0.18
Nodes (16): colorMap, iconColorMap, iconMap, Toast(), ToastProps, ToastContainer(), ForgotPasswordForm(), LoginForm() (+8 more)

### Community 25 - "DashboardView.tsx"
Cohesion: 0.15
Nodes (16): Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle(), COLORS (+8 more)

### Community 26 - "runtime.tsx"
Cohesion: 0.13
Nodes (12): isRegistered(), prefetchTool(), resolveTool(), ErrorBoundaryProps, ErrorBoundaryState, ToolErrorBoundary, ToolRenderer(), ToolRendererProps (+4 more)

### Community 27 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 29 - "field.tsx"
Cohesion: 0.13
Nodes (16): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, Field(), FieldContent(), FieldDescription(), FieldError() (+8 more)

### Community 30 - "auth.ts"
Cohesion: 0.16
Nodes (13): API_ENDPOINTS, HTTP_STATUS, SOCKET_EVENTS, WS_BASE_URL, api, refreshSubscribers, AuthState, ChangePasswordData (+5 more)

### Community 31 - "ChatPage.tsx"
Cohesion: 0.13
Nodes (14): ChatEmptyState, ChatEmptyStateProps, containerVariants, iconMap, itemVariants, QuickAction, QuickActionProps, ChatPage() (+6 more)

### Community 32 - "ticket.ts"
Cohesion: 0.24
Nodes (14): mapBackendAttachmentToFrontend(), mapBackendMessageToFrontend(), resolveAssetUrl(), ticketService, ActivityLog, Attachment, CreateTicketData, InternalNote (+6 more)

### Community 33 - "UsersList.tsx"
Cohesion: 0.21
Nodes (11): Props, UserActivityLogs(), UserDetailsDrawer(), UsersList(), UsersTable, UsersToolbar(), useMyLogs(), useUserDetail() (+3 more)

### Community 34 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 35 - "useChatWebSocket.ts"
Cohesion: 0.21
Nodes (15): WS_API_BASE_URL, ChatWidget(), ChatWebSocketOptions, generateId(), getOrCreateSessionId(), IMPORTANT: The frontend NEVER decides a tool is completed., useChatWebSocket(), UseChatWebSocketReturn (+7 more)

### Community 36 - "context-menu.tsx"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 37 - "dropdown-menu.tsx"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 38 - "RuntimeDiagnostics"
Cohesion: 0.25
Nodes (3): RuntimeDiagnostics, DiagnosticEvent, DiagnosticLevel

### Community 39 - "dashboard.ts"
Cohesion: 0.19
Nodes (12): mapDashboardData(), mapBackendTicketToFrontend(), dashboardService, ActionUsagePoint, DashboardData, DashboardMetrics, RecentActivity, RecentTicket (+4 more)

### Community 40 - "tool_lifecycle_bug.mjs"
Cohesion: 0.14
Nodes (8): createHookState(), LOG, NOTE: The current code does NOT finalize running tools here!, NOTE: NO WebSocket message is sent. NO tool status is updated., Ref, s, State, tcDTool

### Community 41 - "UsersTable.tsx"
Cohesion: 0.18
Nodes (11): Badge(), badgeVariants, Checkbox(), Props, RowProps, UserRow, Props, getUserInitials() (+3 more)

### Community 42 - "ActionsList.tsx"
Cohesion: 0.20
Nodes (12): Switch(), ACTION_TYPE_CONFIG, ACTION_TYPES, HTTP_METHODS, ActionModal(), ActionsList(), ParameterFieldsProps, ResponseConfigFieldsProps (+4 more)

### Community 43 - "ActionModal.tsx"
Cohesion: 0.16
Nodes (13): configComponents, fieldVariants, ApiConfigFields(), BasicInfoFields(), InternalConfigFields(), KnowledgeConfigFields(), RpcConfigFields(), SqlConfigFields() (+5 more)

### Community 44 - "sdk.ts"
Cohesion: 0.20
Nodes (13): CreateTicketTool(), diagnostics, LifecycleController, ToolContext, ToolContextValue, ToolSDK, useTool(), MOCK_PRODUCTS (+5 more)

### Community 45 - "ChatSidebar.tsx"
Cohesion: 0.19
Nodes (9): ChatLayout, ChatLayoutProps, ChatSidebar, ChatSidebarProps, ConversationItem, ConversationItemProps, SidebarAction(), SidebarIconButton() (+1 more)

### Community 46 - "registry.ts"
Cohesion: 0.16
Nodes (13): clearRegistry(), defaultVersions, getAllTools(), getAllTypes(), getAllVersions(), getCapabilityManifest(), getRegisteredCapabilities(), getRegistryStats() (+5 more)

### Community 47 - "User"
Cohesion: 0.20
Nodes (11): EditProfileModalProps, Props, mapBackendLogToFrontend(), AuthActions, AuthState, initialState, User, UpdateProfileData (+3 more)

### Community 48 - "index.tsx"
Cohesion: 0.14
Nodes (12): ActionsList, BackupsView, ChatPage, DashboardPage, ForgotPasswordPage, LoginPage, ProfileView, ResetPasswordPage (+4 more)

### Community 49 - "NotificationCenter.tsx"
Cohesion: 0.21
Nodes (9): categoryColors, categoryLabels, NotificationCenter(), pageTitles, ScrollArea(), ScrollBar(), FOCUSABLE_SELECTOR, useModalA11y() (+1 more)

### Community 50 - "item.tsx"
Cohesion: 0.18
Nodes (12): Item(), ItemActions(), ItemContent(), ItemDescription(), ItemFooter(), ItemGroup(), ItemHeader(), ItemMedia() (+4 more)

### Community 51 - "tool_lifecycle_fixed.mjs"
Cohesion: 0.18
Nodes (5): createFixedHookState(), LOG, Ref, s, State

### Community 52 - "ChatMarkdown.tsx"
Cohesion: 0.20
Nodes (8): ChatCodeBlock, ChatCodeBlockProps, InlineCode, InlineCodeProps, ChatMarkdown, ChatMarkdownProps, markdownComponents, REMARK_PLUGINS

### Community 53 - "plugin.ts"
Cohesion: 0.30
Nodes (9): loadDynamicPlugin(), loadRemotePlugin(), registerPlugin(), registerToolPlugin(), ToolPlugin, loadPlugin(), registerTool(), HumanToolDefinition (+1 more)

### Community 54 - "drawer.tsx"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 55 - "UserFormModal.tsx"
Cohesion: 0.20
Nodes (9): CreateFormData, createSchema, EditFormData, editSchema, Props, UserFormModal(), Props, Role (+1 more)

### Community 56 - "user.service.ts"
Cohesion: 0.33
Nodes (8): BulkOperationResult, BulkUserOperationData, CreateUserData, UpdateUserBasicInfo, UpdateUserPasswordData, UpdateUserRolesData, userService, UserFilters

### Community 57 - "main.tsx"
Cohesion: 0.27
Nodes (6): App(), queryClient, AppRoutes(), Theme, ThemeState, useThemeStore

### Community 58 - "Sidebar.tsx"
Cohesion: 0.33
Nodes (7): AppLayout(), pageVariants, itemVariants, navItems, Sidebar(), SidebarState, useSidebarStore

### Community 59 - "useAuthStore"
Cohesion: 0.29
Nodes (8): Header(), mapBackendUserToFrontend(), AuthContext, AuthProvider(), ProtectedRoute(), ProtectedRouteProps, PublicOnlyRoute(), useAuthStore

### Community 60 - "TicketDetail.tsx"
Cohesion: 0.33
Nodes (8): Tabs(), TabsContent(), TabsList(), TabsTrigger(), CreateTicketModal(), TicketDetail(), useTicketDetail(), useTicketMutations()

### Community 61 - "backup.service.ts"
Cohesion: 0.28
Nodes (7): backupService, GetBackupsParams, Backup, BackupChange, BackupListResponse, BackupMetric, BackupStatus

### Community 62 - "ErrorBoundary"
Cohesion: 0.25
Nodes (3): ErrorBoundary, Props, State

### Community 63 - "empty.tsx"
Cohesion: 0.29
Nodes (7): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle()

### Community 64 - "MetricCard.tsx"
Cohesion: 0.33
Nodes (4): CountUp(), CountUpProps, MetricCard(), MetricCardProps

### Community 65 - "toggle-group.tsx"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 66 - "RevealCard.tsx"
Cohesion: 0.47
Nodes (4): RevealCard(), RevealCardProps, useScrollReveal(), UseScrollRevealOptions

### Community 67 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, paths, files, @/*, references

### Community 68 - "alert.tsx"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

## Knowledge Gaps
- **402 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+397 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `react`, `sidebar.tsx`, `types.ts`, `ChatWidget.tsx`, `button.tsx`, `input.tsx`, `utils.ts`, `BackupsView.tsx`, `alert-dialog.tsx`, `command.tsx`, `TicketQueue.tsx`, `DashboardView.tsx`, `field.tsx`, `ChatPage.tsx`, `menubar.tsx`, `useChatWebSocket.ts`, `context-menu.tsx`, `dropdown-menu.tsx`, `UsersTable.tsx`, `ActionsList.tsx`, `sdk.ts`, `ChatSidebar.tsx`, `NotificationCenter.tsx`, `item.tsx`, `ChatMarkdown.tsx`, `drawer.tsx`, `Sidebar.tsx`, `TicketDetail.tsx`, `empty.tsx`, `MetricCard.tsx`, `toggle-group.tsx`, `RevealCard.tsx`, `alert.tsx`?**
  _High betweenness centrality (0.399) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `utils.ts`, `react`, `devDependencies`, `sonner`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dependencies`, `toggle-group.tsx`, `sidebar.tsx`, `ActionModal.tsx`, `utils.ts`, `alert-dialog.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _406 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03636363636363636 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.059506531204644414 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06612244897959184 - nodes in this community are weakly interconnected._