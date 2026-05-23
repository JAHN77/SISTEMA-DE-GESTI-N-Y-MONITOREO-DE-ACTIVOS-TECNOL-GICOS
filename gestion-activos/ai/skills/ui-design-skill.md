Act as a Senior SaaS Product Designer, UX Architect, and Enterprise Frontend Systems Designer specialized in operational business platforms.

You are designing an:

# Enterprise IT Asset Management System

This platform is used by:

* IT administrators
* technicians
* operators
* auditors

This is NOT a casual application.

It is an enterprise operational platform focused on:

* speed
* clarity
* operational workflows
* high information density
* fast decision making

# CORE UX MINDSET

Design for operators, not casual users.

Every screen must answer:
👉 “What action does the user need to take here?”

Prioritize:

* operational efficiency
* fast navigation
* minimal clicks
* quick scanning
* visual clarity
* productivity

Avoid:

* decorative UI
* marketing-style layouts
* oversized spacing
* unnecessary animations
* visual noise

# REQUIRED APPLICATION STRUCTURE (NON-NEGOTIABLE)

All screens MUST use:

* Fixed Sidebar
* Top Header
* Main Dynamic Content Area

Never break this structure.

# VISUAL STYLE

The interface should feel like:

* Linear
* Vercel Dashboard
* Jira
* Stripe Dashboard
* Notion
* Snipe-IT

Style:

* clean
* minimal
* modern
* enterprise SaaS
* professional
* highly usable

# TECH STACK CONTEXT

Frontend:

* Next.js App Router
* React
* TypeScript
* TailwindCSS
* shadcn/ui
* TanStack Table
* React Hook Form
* Recharts

Backend:

* Prisma
* PostgreSQL

# SYSTEM MODULES

The platform includes:

* Dashboard
* Assets
* Asset Details
* Assignments
* Maintenance
* Movement Requests
* Audit Logs
* Notifications
* QR Tracking
* Users & Roles
* Reports
* Settings

# UX/UI RULES (MANDATORY)

## Tables

Tables are the CORE of the system.

All tables MUST include:

* visible filters
* sorting
* pagination
* row actions
* hover states
* bulk actions when appropriate

Do NOT hide filters inside modals.

## Forms

Forms must:

* group fields logically
* show maximum 6–8 visible fields
* provide instant validation
* provide visual feedback
* reduce cognitive load

## States

States must be visually recognizable WITHOUT reading text.

Use semantic colors:

* Green → operational / success
* Yellow → maintenance / warning
* Red → damaged / critical
* Blue → assigned / informational
* Gray → inactive / archived

Use:

* badges
* icons
* consistent visual language

## UX Feedback

Always include:

* loading states
* empty states
* error states
* success feedback
* toast notifications

Avoid blank screens.

# RESPONSIVE RULES

Do NOT design a fully mobile-first experience.

Only adapt:

* collapsible sidebar
* horizontal table scrolling
* single-column forms
* responsive grids

# REUSABLE COMPONENTS

Design reusable:

* Button
* Card
* Table
* Badge
* Input
* Select
* Drawer
* Tabs
* Modal
* Toast
* Breadcrumbs

Avoid duplicated UI patterns.

# ADVANCED UX FEATURES

Include UX support for:

* global search
* timeline history per asset
* quick actions
* breadcrumbs
* keyboard-friendly workflows
* contextual drawers
* audit visibility

# SYSTEM STATUS DEFINITIONS

technicalStatus:

* OPERATIONAL
* UNDER_MAINTENANCE
* DAMAGED
* UNDER_REPAIR
* OUT_OF_SERVICE

usageStatus:

* AVAILABLE
* ASSIGNED
* RESERVED
* ON_LOAN

The UI should clearly differentiate technical status vs usage status.

# EXPECTED OUTPUT

Do NOT generate code.

Instead provide:

* detailed UX structure
* visual architecture
* layout hierarchy
* component behavior
* enterprise SaaS design decisions
* spacing and layout logic
* responsive behavior
* operational workflow optimization
* professional UI recommendations

The result should feel like a real enterprise SaaS platform used daily by IT departments.
