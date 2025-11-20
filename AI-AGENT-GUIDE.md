# UBA AI Agent - Complete Implementation Guide

## Overview

The UBA AI Agent is an intelligent assistant with full contextual awareness of the workspace and user. It functions as a natural language interface to analyze data, generate content, make predictions, and execute actions. Built for local-mode operation with a clean architecture ready for remote LLM integration.

## Architecture

### Core Modules

1. **`assets/js/ai-agent.js`** (850 lines)
   - Core AI engine with NLP capabilities
   - Data awareness across all UBA modules
   - Promise-based async API

2. **`assets/js/ai-chat-ui.js`** (450 lines)
   - Chat interface with message history
   - Quick commands and suggestions
   - Conversation persistence

3. **`assets/css/ai-chat.css`** (350 lines)
   - Complete UI styling
   - Animations and transitions
   - Dark mode support

## API Reference

### Core Engine (`UBA.ai`)

#### analyzeWorkspace()
Generates comprehensive insights from all workspace data.

```javascript
const analysis = await UBA.ai.analyzeWorkspace();

// Returns:
{
  success: true,
  insights: {
    summary: {
      totalTasks: 7,
      totalClients: 2,
      totalProjects: 4,
      totalInvoices: 6,
      activityScore: 0
    },
    tasks: { total, overdue, dueToday, completed, completionRate },
    clients: { total, active, inactive, mostRecent },
    projects: { total, ongoing, completed, lead },
    invoices: { total, paid, unpaid, draft, totalRevenue, outstanding },
    leads: { total, hot, warm, cold },
    financial: { revenue, expenses, profit, profitMargin },
    automation: { total, active, inactive },
    subscription: { plan, status, usage, limits },
    recommendations: [...]
  },
  timestamp: "2025-01-01T00:00:00.000Z"
}
```

#### answer(query)
Process natural language queries with rule-based NLP.

```javascript
const response = await UBA.ai.answer('Show me overdue tasks');

// Returns:
{
  success: true,
  query: "Show me overdue tasks",
  intent: "list",
  confidence: 0.85,
  response: "Found 3 overdue tasks:\n\n1. Review proposal\n2. Follow up...",
  actionRequired: false,
  suggestions: ["Create a new task", "Show tasks due today", ...],
  timestamp: "2025-01-01T00:00:00.000Z"
}
```

**Supported Intents:**
- `analyze` - Workspace analysis
- `list`, `show`, `get` - List entities
- `create`, `add` - Create new entities
- `update`, `edit` - Update entities
- `delete`, `remove` - Delete entities
- `predict` - Forecasting
- `summarize` - Generate summaries
- `help` - Show help

**Supported Entities:**
- task, client, project, invoice, lead, expense
- automation, member, workspace

#### generate(type, payload)
Create content from natural language input.

```javascript
// Generate task
const task = await UBA.ai.generate('task', {
  title: 'Follow up with client',
  dueDate: '2025-01-30'
});

// Generate project description
const projectDesc = await UBA.ai.generate('project-description', {
  project: { name: 'Website Redesign', objective: 'Modern UI' }
});

// Generate invoice
const invoice = await UBA.ai.generate('invoice', {
  client: { name: 'Acme Corp' },
  items: [...],
  total: 5000
});
```

**Supported Types:**
- `task` - Task with title, description, due date
- `note` - Note with content and tags
- `project-description` - Formatted project description
- `client-summary` - Client profile summary
- `invoice` - Invoice with line items
- `report` - Workspace report
- `email` - Email with template

#### predict(type)
Estimate outcomes and forecasts.

```javascript
// Predict deadline
const deadline = await UBA.ai.predict('deadline');
// Returns: { estimatedDays: 7, confidence: 0.7, reasoning: "..." }

// Predict financial projection
const financials = await UBA.ai.predict('financial-projection');
// Returns: { nextMonth: 5000, confidence: 0.6, trend: 'up', reasoning: "..." }

// Predict lead conversion
const conversion = await UBA.ai.predict('lead-conversion');
// Returns: { probability: 0.75, count: 3, confidence: 0.65, reasoning: "..." }
```

**Supported Predictions:**
- `deadline` - Task completion time estimation
- `priority` - Task priority prediction
- `overdue-risk` - Risk of tasks becoming overdue
- `financial-projection` - Revenue forecasting
- `lead-conversion` - Lead conversion probability
- `churn-risk` - Client churn risk assessment

#### execute(action, payload)
Perform real actions using UBA.data.

```javascript
// Create task
const result = await UBA.ai.execute('create-task', {
  title: 'Review proposal',
  priority: 'high'
});

// Update client
await UBA.ai.execute('update-client', {
  clientId: 'client-123',
  updates: { status: 'active' }
});

// Generate invoice
await UBA.ai.execute('generate-invoice', {
  client: { name: 'Acme Corp' },
  total: 5000
});
```

**Supported Actions:**
- `create-task` - Create new task
- `update-client` - Update client data
- `generate-invoice` - Create invoice
- `run-automation` - Execute automation rule
- `send-email` - Send email (mock)
- `create-project` - Create new project
- `update-task-status` - Change task status

**Permission Checks:**
All execute actions check user permissions via `Members.hasPermission()` before execution.

#### Memory Management

```javascript
// Get conversation history (last 10 queries)
const memory = UBA.ai.getMemory(10);

// Clear conversation memory
UBA.ai.clearMemory();
```

Memory includes:
- Last 10 queries per workspace
- Parsed intents and entities
- Timestamps
- Context tracking (last intent, entity, action)

### Chat UI (`window.AIUI`)

#### togglePanel()
Open/close the chat panel.

```javascript
window.AIUI.togglePanel();
```

#### sendMessage()
Send message from input field.

```javascript
// Called automatically on Enter key
window.AIUI.sendMessage();
```

#### sendQuickQuery(query)
Send predefined query from suggestion chip.

```javascript
window.AIUI.sendQuickQuery('Analyze workspace');
```

#### clearChat()
Clear conversation history.

```javascript
window.AIUI.clearChat();
```

### Quick Commands

Type `/` in the chat to use quick commands:

- `/task [title]` - Create a task
- `/client` - Show clients
- `/invoice` - Show invoices
- `/analyze` - Analyze workspace
- `/help` - Show help

**Examples:**
```
/task Follow up with client
/client
/invoice
/analyze
/help
```

## Data Awareness

The AI agent has full access to:

### Workspace Data
- **Tasks**: status, due dates, assignees, priorities
- **Clients**: contact info, status, relationships
- **Projects**: stages, budgets, timelines
- **Invoices**: amounts, payment status, due dates
- **Leads**: scores, priorities, conversion stages
- **Expenses**: amounts, categories, dates
- **Automations**: rules, triggers, actions

### System Data
- **Subscription**: plan, limits, usage counters
- **Members**: roles, permissions, status
- **Feature Flags**: enabled features, rollout status
- **Analytics**: activity scores, event timelines
- **Billing**: payment history, upcoming charges

## Natural Language Processing

### Intent Detection

Rule-based pattern matching identifies user intent:

```javascript
// Analysis queries
"analyze workspace" → intent: "analyze"
"show me insights" → intent: "analyze"

// List queries
"show all tasks" → intent: "list", entity: "task"
"find clients" → intent: "list", entity: "client"

// Creation queries
"create a task" → intent: "create", entity: "task"
"add new client" → intent: "create", entity: "client"

// Prediction queries
"predict revenue" → intent: "predict"
"estimate deadline" → intent: "predict"
```

### Entity Recognition

Detects entity types in queries:

- task, client, project, invoice
- lead, expense, automation
- member, workspace

### Confidence Scoring

Returns confidence percentage (0-100%) with each response:

- High confidence (80-100%): Clear intent match
- Medium confidence (50-79%): Probable intent
- Low confidence (0-49%): Unclear/general query

Confidence is displayed in the UI as a badge.

## Message Formatting

The chat supports markdown-like formatting:

```
**bold text** → bold text
*italic text* → italic text
`code` → code
Multi-line text → line breaks preserved
```

## Conversation Flow

### Example Conversation

**User:** "Analyze workspace"

**AI Response:**
```
Here's what I found:

📊 **Workspace Overview:**
- 7 tasks (0 overdue)
- 2 clients
- 4 projects
- 6 invoices
- Activity score: 0/100

💡 **Recommendations:**
1. 1 invoice is unpaid. Total outstanding: €8900.00
2. Your workspace activity is low. Consider setting up automations.
```

**Confidence:** 90%

**Suggestions:**
- Analyze workspace
- Show recent activity
- What can you help with?
- Generate weekly summary

### Context Awareness

The AI maintains context across the conversation:

```javascript
this.context = {
  lastIntent: 'analyze',
  lastEntity: 'task',
  lastAction: 'create-task',
  conversationId: 'conv-xxx'
}
```

This enables follow-up questions:
```
User: "Show me all tasks"
AI: "Found 7 tasks..."

User: "Filter by overdue"  // AI knows we're talking about tasks
AI: "Found 0 overdue tasks"
```

## Workspace Insights

### Analysis Components

#### Task Analysis
- Total tasks, overdue count, due today
- Completion rate percentage
- In-progress vs done breakdown

#### Client Analysis
- Total clients, active vs inactive
- Most recent clients (last 5)
- Activity patterns

#### Financial Analysis
- Total revenue (paid invoices)
- Outstanding amount (unpaid)
- Profit margin calculation
- Expense tracking

#### Activity Scoring (0-100)
Based on:
- Recent events and actions
- Entity creation/updates
- User engagement
- System usage patterns

### Recommendations Engine

Generates actionable recommendations:

**Overdue Tasks Alert:**
```
"You have 3 overdue tasks. Consider reviewing them."
Priority: High
Action: show-overdue-tasks
```

**Unpaid Invoices:**
```
"2 invoices are unpaid. Total outstanding: €5,000"
Priority: Medium
Action: show-unpaid-invoices
```

**Hot Leads:**
```
"5 hot leads ready for follow-up."
Priority: High
Action: show-hot-leads
```

**Low Activity:**
```
"Your workspace activity is low. Consider setting up automations."
Priority: Low
Action: setup-automations
```

**Limit Warnings:**
```
"You're using 90% of your clients limit. Consider upgrading."
Priority: Medium
Action: upgrade-plan
```

## Permission Integration

The AI checks permissions before executing actions:

```javascript
async execute(action, payload) {
  const canExecute = await this._checkExecutePermission(action);
  if (!canExecute) {
    return {
      success: false,
      error: 'Insufficient permissions',
      requiresPermission: true
    };
  }
  // Execute action
}
```

**Permission Mapping:**
- `create-task` → requires `createData` permission
- `update-client` → requires `editData` permission
- `run-automation` → requires `manageAutomations` permission
- etc.

## Local vs Remote Mode

### Current Implementation (Local Mode)

**Intent Detection:**
```javascript
_parseQuery(query) {
  // Rule-based pattern matching
  if (query.match(/analyze|insights/)) {
    intent = 'analyze';
    confidence = 0.9;
  }
  // ...
}
```

**Entity Recognition:**
```javascript
if (lowerQuery.match(/task/)) entity = 'task';
else if (lowerQuery.match(/client/)) entity = 'client';
// ...
```

**Generation:**
```javascript
_generateTask(payload) {
  return {
    title: payload.title || 'New task',
    description: payload.description || '',
    dueDate: payload.dueDate || futureDate,
    priority: payload.priority || 'medium'
  };
}
```

### Future Implementation (Remote Mode with LLM)

**Intent Detection:**
```javascript
async answer(query) {
  if (UBA.config.storageMode === 'remote') {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        query,
        context: this.context,
        memory: this.getMemory(),
        workspaceData: await this.analyzeWorkspace()
      })
    });
    
    const llmResponse = await response.json();
    return {
      success: true,
      query,
      intent: llmResponse.intent,
      confidence: llmResponse.confidence,
      response: llmResponse.answer,
      suggestions: llmResponse.suggestions
    };
  } else {
    // Local rule-based NLP
  }
}
```

**Generation:**
```javascript
async generate(type, payload) {
  if (UBA.config.storageMode === 'remote') {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ type, payload })
    });
    return await response.json();
  } else {
    // Local template-based generation
  }
}
```

**Zero UI changes needed!** The chat interface and all UBA.ai methods remain identical.

## UI Components

### Floating Action Button
- Bottom-right corner (60x60px)
- Gradient purple background
- Shows "Ask UBA AI" label on hover
- Smooth scale animation

### Chat Panel
- 420x600px on desktop
- Full-screen on mobile
- Slide-in animation from bottom-right
- Backdrop blur when open

### Header
- AI avatar with icon
- "Online" status indicator
- Clear chat button
- Close button

### Messages
- User messages: right-aligned, purple gradient
- AI messages: left-aligned, dark background
- Confidence badges (90%)
- Timestamps (11:10 PM)
- Markdown formatting

### Typing Indicator
- Three animated dots
- "AI is thinking..." text
- Shown during query processing

### Suggestion Chips
- Four context-aware suggestions
- Hover effects
- One-click to send query
- Updated after each response

### Input Area
- Text input with placeholder
- Send button (paper plane icon)
- Command hint footer
- Enter key to send

## Responsive Design

**Desktop (>768px):**
- 420x600px panel
- Bottom-right positioning
- Suggestion chips in rows

**Mobile (≤768px):**
- Full-screen panel (minus margins)
- Stacked layout
- Touch-friendly buttons (40x40px)
- Single-column suggestions

## Persistence

### Conversation History
Stored in localStorage per workspace:

```javascript
// Key format
`uba-ai-conversation-${workspaceId}`

// Keeps last 20 messages
{
  sender: 'user' | 'ai',
  content: 'message text',
  metadata: { intent, confidence, suggestions },
  timestamp: '2025-01-01T00:00:00.000Z'
}
```

### Memory
Stored in-memory during session:

```javascript
// Last 10 queries per workspace
this.memory[workspaceId] = [
  { query, parsed, timestamp },
  // ...
]
```

## Analytics Integration

The AI tracks its own usage:

```javascript
// After each action
if (UBA.analytics) {
  await UBA.analytics.track.trackAIAction(action, result);
}
```

Tracked events:
- AI queries submitted
- Intents detected
- Actions executed
- Errors encountered
- Response times

## Error Handling

```javascript
try {
  const response = await UBA.ai.answer(query);
} catch (error) {
  return {
    success: false,
    error: error.message,
    response: "I encountered an error. Could you rephrase that?"
  };
}
```

User-friendly error messages:
- "I encountered an error. Please try again."
- "I couldn't find any matching records."
- "Insufficient permissions to execute this action."
- "Unknown command: /xyz. Type /help for available commands."

## Testing

### Manual Testing Checklist

✅ **Floating Button**
- Displays in bottom-right corner
- Shows/hides label on hover
- Opens panel on click

✅ **Chat Panel**
- Slides in smoothly
- Shows welcome message
- Displays suggestion chips

✅ **Message Sending**
- Enter key sends message
- Send button works
- User message appears
- Typing indicator shows
- AI response appears

✅ **Quick Commands**
- `/task` creates task
- `/client` lists clients
- `/invoice` shows invoices
- `/analyze` analyzes workspace
- `/help` shows help

✅ **Suggestions**
- Chips update after response
- Click sends query
- Context-aware suggestions

✅ **Workspace Analysis**
- Returns comprehensive insights
- Shows task/client/project counts
- Displays recommendations
- Calculates activity score

✅ **Confidence Display**
- Badge shows percentage
- Color-coded (green for high)
- Tooltip on hover

✅ **Conversation Persistence**
- Messages persist across reloads
- Clear chat removes history
- Workspace-scoped storage

✅ **Permissions**
- Execute checks permissions
- Shows error if insufficient
- Respects role restrictions

## Future Enhancements

### Phase 1: Enhanced NLP
- Advanced pattern matching
- Entity extraction improvements
- Context-aware follow-ups
- Multi-turn conversations

### Phase 2: LLM Integration
- OpenAI GPT-4 integration
- Anthropic Claude integration
- Custom prompts per entity type
- Fine-tuned models for domain tasks

### Phase 3: Advanced Features
- Voice input/output
- Image analysis for invoices/receipts
- Automated task scheduling
- Smart recommendations engine
- Predictive analytics

### Phase 4: Collaboration
- Multi-user conversations
- Team mentions (@username)
- Shared conversation threads
- AI-assisted collaboration

## Security Considerations

### Local Mode
- No data leaves the browser
- localStorage only for persistence
- No external API calls
- User data remains private

### Remote Mode (Future)
- Encrypted API communication
- Token-based authentication
- Rate limiting
- Input sanitization
- PII filtering before LLM

## Troubleshooting

**AI not responding:**
- Check console for errors
- Verify UBA.data is loaded
- Ensure workspace has data

**Suggestions not updating:**
- Check intent detection
- Verify suggestion generator
- Reload page

**Permission errors:**
- Check user role
- Verify Members module loaded
- Review permission mapping

**Conversation not persisting:**
- Check localStorage quota
- Verify workspace ID
- Clear old conversations

## Developer Notes

### Adding New Intents

```javascript
// In _parseQuery()
if (lowerQuery.match(/custom-intent/)) {
  intent = 'custom';
  confidence = 0.8;
}

// Add handler
async _handleCustomQuery(parsed) {
  // Implementation
  return "Custom response";
}
```

### Adding New Entity Types

```javascript
// In _parseQuery()
if (lowerQuery.match(/newentity/)) {
  entity = 'newentity';
}

// Add to UBA.data.list() calls
const entities = await UBA.data.list('newentity');
```

### Adding New Actions

```javascript
// Define action
async _executeCustomAction(payload) {
  // Implementation
  return { success: true, message: "Done" };
}

// Add to execute() switch
case 'custom-action':
  result = await this._executeCustomAction(payload);
  break;
```

## Conclusion

The UBA AI Agent provides a complete natural language interface to the MHM UBA platform. It's built with clean architecture, full data awareness, and ready for future LLM integration while maintaining zero breaking changes to existing code.

**Key Benefits:**
- ✅ Natural language interaction
- ✅ Full workspace awareness
- ✅ Intelligent recommendations
- ✅ Permission-aware actions
- ✅ LLM-ready architecture
- ✅ Zero backend required (local mode)
- ✅ Production-ready code

For questions or issues, see the troubleshooting section or check the browser console for detailed logs.
