# CONTEXT.md — Proposed Updates

> Following [grill-with-docs](file:///C:/Users/Garry/.gemini/config/skills/grill-with-docs/SKILL.md) discipline: challenge terms against the existing glossary, sharpen fuzzy language, add new terms as decisions crystallize.

## Current State

The existing CONTEXT.md is well-written and covers core domain terms. However, the improvement plan introduces new concepts that need domain-level names before implementation begins.

## Terms to Add

The following terms emerged from the architecture review and PRD. Each should be added to CONTEXT.md under a new **"Resilience & Observability"** subheading.

---

### New Terms

**Connection State**:
The current status of a Member's WebSocket link to the Channel: `connected`, `connecting`, or `disconnected`. Displayed as a visual indicator on the Board. Not a property of the Member — it's a property of their current browser session.
_Avoid_: Online status, presence (presence implies awareness of other Members' state, which this is not)

**Activity Log**:
A chronological record of Task mutations (created, updated, deleted) and Member actions (invited, removed). Each entry records the actor, the action, the affected Task or Member, and a timestamp. Visible only to Admins.
_Avoid_: Audit trail (too formal/compliance-flavored for this context), event log (conflicts with Sync Event), history

**Viewer**:
A Member with the VIEWER Role. Can see the Board and all Tasks but cannot create, update, or delete Tasks. Cannot manage Members. Useful for stakeholders who need visibility without edit access.
_Avoid_: Observer, read-only user, spectator

**Authorization Policy**:
The declarative set of rules that determines which actions each Role can perform. Maps action identifiers (e.g., `task:delete`) to allowed Roles and contextual conditions (e.g., "is the Task creator"). The single source of truth for access control.
_Avoid_: Permission rules, ACL, access matrix (too generic — this is a specific module with a specific interface)

### Terms to Sharpen

**Role** (existing — needs update):
Current: "ADMIN or MEMBER"
Updated: "The permission level of a Member: ADMIN, MEMBER, or VIEWER. Admins can manage Members; Members can manage Tasks; Viewers can only view the Board."

**Admin** (existing — needs clarification):
Add: "An Admin can also view the Activity Log."

### Flagged Ambiguity

**"Task creator" vs "Assignee"**: The improvement plan introduces `creatorId` — the Member who created a Task. This is distinct from `Assignee` (who is currently responsible for it). A Task's creator may reassign it and no longer be the Assignee, but they retain delete permission as the creator. The CONTEXT.md should call this out:

**Creator**:
The Member who originally created a Task. A Task always has exactly one Creator (never null). The Creator retains certain permissions (e.g., delete) regardless of whether they are still the Assignee.
_Avoid_: Author, originator

---

## Updated Example Dialogue (to add as second dialogue)

> **Dev**: "A Member wants to delete a Task they didn't create. Can they?"
>
> **Domain Expert**: "No. Only the Creator of a Task or an Admin can delete it. Any Member can update a Task's Status or details, but deletion is restricted."
>
> **Dev**: "What about Viewers?"
>
> **Domain Expert**: "Viewers can see everything on the Board — Tasks, Members, Priority, Status — but they can't change anything. They're stakeholders who need visibility."
>
> **Dev**: "If the WebSocket drops, what does the Member see?"
>
> **Domain Expert**: "The Connection State indicator turns from green to yellow (connecting) or red (disconnected). The Board still shows the last known state, but new Sync Events won't arrive until it reconnects. It reconnects automatically."
>
> **Dev**: "Where can I see what happened on the Board yesterday?"
>
> **Domain Expert**: "The Activity Log. It's Admin-only. Shows who created, updated, or deleted which Task, and when."

---

## Full Proposed CONTEXT.md

```markdown
# Remote Task Board

A real-time collaborative task management platform for remote teams. Remote Task Board provides a shared Kanban-style board where distributed team members can create, assign, track, and manage tasks with instant synchronization across all connected clients.

## Language

### Core Domain

**Task**:
A unit of work that can be created, assigned, and tracked through status transitions. Each Task has a title, optional description, status, priority, and optional assignee.
_Avoid_: Ticket, item, to-do, card

**Board**:
The primary workspace where Tasks are organized into columns by status. Currently a single shared Board per deployment.
_Avoid_: Dashboard, workspace, project

**Member**:
A user who has been invited to participate in the Board. Members can be assigned Tasks and manage their own work.
_Avoid_: Participant, collaborator, teammate

**Assignee**:
The Member currently responsible for a Task. A Task has zero or one Assignee.
_Avoid_: Owner, responsible person

**Creator**:
The Member who originally created a Task. A Task always has exactly one Creator. The Creator retains certain permissions (e.g., delete) regardless of whether they are still the Assignee.
_Avoid_: Author, originator

### Task Lifecycle

**Status**:
The current stage of a Task in its lifecycle: TODO, IN_PROGRESS, or DONE. Status transitions happen via drag-and-drop on the Board or explicit updates.
_Avoid_: State, phase, stage

**Priority**:
The urgency level of a Task: LOW, MEDIUM, or HIGH. Used for visual indication and filtering, not for ordering.
_Avoid_: Urgency, importance, severity

### Access Control

**Role**:
The permission level of a Member: ADMIN, MEMBER, or VIEWER. Admins can manage Members and view the Activity Log; Members can manage Tasks; Viewers can only view the Board.
_Avoid_: Permission, access level

**Admin**:
A Member with the ADMIN Role. Can invite and remove Members, view the Activity Log, and perform all standard Member capabilities.
_Avoid_: Owner, super user, manager

**Viewer**:
A Member with the VIEWER Role. Can see the Board and all Tasks but cannot create, update, or delete Tasks. Cannot manage Members.
_Avoid_: Observer, read-only user, spectator

**Authorization Policy**:
The declarative set of rules that determines which actions each Role can perform. Maps action identifiers to allowed Roles and contextual conditions. The single source of truth for access control.
_Avoid_: Permission rules, ACL, access matrix

### Real-time Sync

**Sync Event**:
A WebSocket message broadcast to all connected clients when a Task is created, updated, or deleted. Ensures all Board views reflect the latest state.
_Avoid_: Notification, push message, update

**Channel**:
The Pusher/Soketi communication pathway that clients subscribe to for receiving Sync Events. Currently a single `tasks` Channel per deployment.
_Avoid_: Stream, topic, queue

**Connection State**:
The current status of a Member's WebSocket link to the Channel: `connected`, `connecting`, or `disconnected`. Displayed as a visual indicator on the Board. A property of the browser session, not the Member.
_Avoid_: Online status, presence

### Observability

**Activity Log**:
A chronological record of Task mutations and Member actions. Each entry records the actor, the action, the affected entity, and a timestamp. Visible only to Admins.
_Avoid_: Audit trail, event log, history

## Example Dialogues

### Core Workflow

> **Dev**: "When a user drags a card to another column, what happens?"
>
> **Domain Expert**: "That's a Status transition on a Task. The Board updates locally, then a Sync Event is broadcast on the Channel so all other Members see the change."
>
> **Dev**: "Can anyone move any card?"
>
> **Domain Expert**: "Yes, any Member can update any Task's Status. The Admin Role only controls Member management — inviting and removing Members."
>
> **Dev**: "What if two people drag the same card at once?"
>
> **Domain Expert**: "Last write wins. Both Sync Events propagate, and the final Status is whatever the server processed last."

### Permissions & Resilience

> **Dev**: "A Member wants to delete a Task they didn't create. Can they?"
>
> **Domain Expert**: "No. Only the Creator of a Task or an Admin can delete it. Any Member can update a Task's Status or details, but deletion is restricted."
>
> **Dev**: "What about Viewers?"
>
> **Domain Expert**: "Viewers can see everything on the Board — Tasks, Members, Priority, Status — but they can't change anything. They're stakeholders who need visibility."
>
> **Dev**: "If the WebSocket drops, what does the Member see?"
>
> **Domain Expert**: "The Connection State indicator turns from green to yellow (connecting) or red (disconnected). The Board still shows the last known state, but new Sync Events won't arrive until it reconnects. It reconnects automatically."
>
> **Dev**: "Where can I see what happened on the Board yesterday?"
>
> **Domain Expert**: "The Activity Log. It's Admin-only. Shows who created, updated, or deleted which Task, and when."
```
