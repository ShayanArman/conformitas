# Email Workflow Architecture

## Overview

The system is composed of three interconnected workflows that handle email cleaning operations through a coordinated process.

---

## Core Workflows

### CleanEmails Workflow (Parent Coordinator)

The main orchestrator workflow that manages child workflow execution.

**Payload Structure:**
```typescript
export interface CleanEmailsPayload {
  // Pointers to the specific child runs
  batchEmailsWorkflowSk: string;
  moveEmailsWorkflowSk: string;
}
```

---

### BatchEmails Workflow

Handles the analysis and batch creation phase of email processing.

**Responsibilities:**
- Analyzes incoming emails
- Determines appropriate batches
- Calculates destination folders for each batch
- Creates inputs with suggested actions
- Enables user overrides for suggestions

**Important Note:** User interaction with these inputs occurs outside the workflow stages, as users are directly acting on the created inputs.

---

### MoveEmails Workflow

Executes the approved email movements after user confirmation.

**Execution Requirements:**
- Only runs after user approval
- Requires BatchEmails workflow completion
- Depends on Google or Outlook Resource availability

---

## Workflow Sequencing

### Current Challenge

**Question:** How do we know when to kick off MoveEmails?

### Proposed Solution

Implement a callback function pattern within the BatchEmails workflow:
*"Okay, I'm done. What should I do next?"*
1. Upon completion, BatchEmails runs the callback Function
2. The parent Orchestrator **Started** BatchEmails with a callback function

This approach delegates execution timing responsibility to the orchestrator while keeping workflows modular and maintainable.