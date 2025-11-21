(() => {
  const translations = {
    en: {
      assistant_title: "UBA Assistant",
      assistant_subtitle: "Ask UBA Assistant for guidance and quick tips.",
      assistant_placeholder: "Ask a question…",
      "language.label": "Language",
      "language.en": "English",
      "language.ar": "Arabic",
      "language.nl": "Dutch",
      "language.fr": "French",
      "language.es": "Spanish",
      "language.de": "German",

      "app.tagline":
        "Universal Business Automator — one workspace for clients, tasks, invoices and smart tools.",
      "app.badge": "Private beta · Built in the Netherlands",
      "sidebar.footer":
        "Designed for small teams and solo founders who are tired of 7 different tools just to run one business.",
      "top.kicker": "Workspace",

      "nav.workspaceLabel": "Workspace",
      "nav.dashboard": "Dashboard",
      "nav.dashboardSub": "Overview",
      "nav.clients": "Clients",
      "nav.clientsSub": "CRM",
      "nav.projects": "Projects",
      "nav.projectsSub": "Pipeline",
      "nav.tasks": "Tasks",
      "nav.tasksSub": "Today",
      "nav.invoices": "Invoices",
      "nav.invoicesSub": "Billing",
      "nav.automations": "Automations",
      "nav.automationsSub": "Flows",
      "nav.smartTools": "UBA Smart Tools",
      "nav.smartToolsSub": "AI ops",
      "nav.insights": "Insights Lab",
      "nav.insightsSub": "Reports",
      "nav.support": "Success Desk",
      "nav.supportSub": "Guidance",
      "nav.settings": "Settings",
      "nav.settingsSub": "Workspace",

      "view.dashboard.title": "Business overview",
      "view.dashboard.desc":
        "Today’s snapshot across your clients, invoices, tasks and automations.",
      "view.clients.title": "Clients",
      "view.clients.desc": "Local CRM board with quick add, edit, and delete.",
      "view.clients.badge": "Local CRM",
      "view.clients.summary": "Client snapshot",
      "view.clients.summaryDesc": "Quick health of your local CRM list.",
      "view.clients.local": "Local only",
      "view.clients.total": "Total clients",
      "view.clients.tip": "Add a client to get started.",
      "view.clients.tipDone": "Clients saved locally",
      "view.clients.recent": "Recent note",
      "view.clients.recentTip": "Pulled from latest saved contact.",
      "view.clients.hintTitle": "Keep records tidy",
      "view.clients.hintDesc":
        "Use the notes field for renewal dates, goals, or active projects.",
      "view.clients.localTitle": "Local-first",
      "view.clients.localDesc":
        "Data is stored in your browser. Export or sync later.",
      "view.projects.title": "Projects",
      "view.projects.desc": "Pipeline view of active work, staged locally.",
      "view.projects.badge": "Pipeline",
      "projects.add": "Add project",
      "projects.modal.title": "Project",
      "projects.modal.sub": "Create or edit a project",
      "projects.form.titlePlaceholder": "Project title",
      "projects.form.clientPlaceholder": "Client",
      "projects.form.budgetPlaceholder": "Budget",
      "projects.form.notesPlaceholder": "Notes (optional)",
      "projects.form.cancel": "Cancel",
      "projects.form.save": "Save",
      "view.projects.kicker": "Pipeline flow",
      "view.projects.titleInline": "Progress projects by stage",
      "view.projects.subtitle":
        "Drag-style layout with cards organized by phase.",
      "view.tasks.title": "Tasks",
      "view.tasks.desc":
        "Kanban-style board with local tasks and quick actions.",
      "view.tasks.badge": "Local board",
      "view.tasks.owner": "Owner",
      "view.tasks.moveBack": "Move back",
      "view.tasks.moveForward": "Move next",
      "view.invoices.title": "Invoices",
      "view.invoices.desc":
        "Full CRUD with local storage, matching the dashboard style.",
      "view.invoices.badge": "Local billing",
      "view.invoices.local": "Local only",
      "view.invoices.due": "Due",
      "view.automations.title": "Automations",
      "view.automations.desc": "Overview of flows with sample activity logs.",
      "view.automations.badge": "Preview",
      "view.automations.local": "Local only",
      "view.automations.logTitle": "Recent runs",
      "view.automations.logDesc": "Lightweight history of automation activity",
      "view.automations.logHint": "Static sample data for now.",
      "view.automations.logAutomation": "Automation",
      "view.calendar.title": "Calendar",
      "view.calendar.desc": "Monthly overview of tasks, deadlines and events.",
      "view.automations.logStatus": "Status",
      "view.automations.logTime": "When",
      "automations.new": "New Automation",
      "automations.edit": "Edit Automation",
      "automations.empty": "No automations yet. Create your first rule.",
      "automations.trigger": "Trigger",
      "automations.action": "Action",
      "automations.meta.count": "Active rules",
      "automations.meta.runs": "Total runs",
      "automations.recentRuns": "Recent Runs",
      "automations.recentRunsDesc": "History of automation executions",
      "automations.clearLogs": "Clear Logs",
      "automations.noLogs": "No automation runs yet.",
      "automations.logRule": "Rule",
      "automations.logTrigger": "Trigger",
      "automations.logResult": "Result",
      "automations.logTime": "Time",
      "triggers.invoiceCreated": "Invoice Created",
      "triggers.invoiceOverdue": "Invoice Overdue",
      "triggers.clientCreated": "Client Created",
      "triggers.taskDueToday": "Task Due Today",
      "triggers.projectCompleted": "Project Completed",
      "actions.createTask": "Create Task",
      "actions.addNoteToClient": "Add Note to Client",
      "actions.showNotification": "Show Notification",
      "actions.sendEmail": "Send Email (Demo)",
      "view.smartTools.title": "UBA Smart Tools",
      "view.smartTools.desc":
        "Cards for available assistants, matching the dashboard style.",
      "view.smartTools.badge": "Live concepts",
      "view.insights.title": "Insights Lab",
      "view.insights.desc":
        "Narrative dashboards for founders: trends, risks, and quick wins in one glance.",
      "view.insights.badge": "Preview",
      "view.support.title": "Success Desk",
      "view.support.desc":
        "Quick help topics and links with the familiar dashboard styling.",
      "view.support.badge": "Ready",
      "view.settings.title": "Settings",
      "view.settings.desc": "Workspace preferences and language defaults.",
      "view.settings.note": "Preferences are stored locally for this browser.",
      "view.invoices.kicker": "Finance",
      "invoices.open": "Open:",
      "invoices.paid": "Paid:",
      "invoices.overdue": "Overdue:",
      "invoices.empty": "No invoices yet.",
      "invoices.new": "New Invoice",
      "invoices.edit": "Edit Invoice",
      "btn.newInvoice": "New invoice",
      "btn.newAutomation": "New automation",
      "view.automations.empty":
        "No automations yet. Create your first workflow using triggers and actions.",
      "view.smartTools.kicker": "Tools",
      "btn.exploreTools": "Explore tools",
      "view.insights.kicker": "Insights",
      "view.insights.empty":
        "Insights will surface here: revenue trends, client distribution, and alerts.",
      "view.settings.kicker": "Settings",
      "view.settings.configure":
        "Configure your workspace, billing, and integrations.",

      "insights.panels.title": "Analytics panels",
      "insights.panels.desc":
        "Placeholder UBA cards ready for your metrics, annotations, and exports.",
      "insights.panels.badge": "Local only",
      "insights.panels.revenue.title": "Revenue runway",
      "insights.panels.revenue.desc":
        "Upcoming renewals and billed totals visualized for quick reads.",
      "insights.panels.revenue.tag": "€ placeholder",
      "insights.panels.clients.title": "Client momentum",
      "insights.panels.clients.desc":
        "Track new wins, churn risks, and average deal velocity.",
      "insights.panels.clients.tag": "CRM placeholder",
      "insights.panels.projects.title": "Project flow",
      "insights.panels.projects.desc":
        "Map lead → delivery → support to surface bottlenecks.",
      "insights.panels.projects.tag": "Pipeline placeholder",
      "insights.panels.workload.title": "Workload balance",
      "insights.panels.workload.desc":
        "Compare task load per owner with a simple placeholder chart.",
      "insights.panels.workload.tag": "Ops placeholder",
      "insights.brief.title": "Narrative brief",
      "insights.brief.desc":
        "Simple story blocks to keep stakeholders aligned.",
      "insights.brief.badge": "Placeholder",
      "insights.brief.items.readout.title": "Signal readout",
      "insights.brief.items.readout.desc":
        "Use this block to summarize what changed in the last sprint.",
      "insights.brief.items.nextSteps.title": "Next steps",
      "insights.brief.items.nextSteps.desc":
        "List the experiments or follow-ups to run before sharing an export.",
      "insights.brief.items.risks.title": "Risks",
      "insights.brief.items.risks.desc":
        "Call out blockers, overdue items, or data gaps before presenting.",

      "settings.workspace.title": "Workspace settings",
      "settings.workspace.desc": "Store local preferences for this workspace.",
      "settings.workspace.badge": "Local only",
      "settings.workspace.name": "Workspace name",
      "settings.workspace.placeholder": "Name your workspace",
      "settings.workspace.timezone": "Timezone",
      "settings.workspace.language": "Default language",
      "settings.workspace.save": "Save preferences",
      "settings.workspace.status": "Unsaved",
      "settings.workspace.saved": "Saved",
      "settings.profile.title": "Profile",
      "settings.profile.name": "Name",
      "settings.profile.email": "Email",
      "settings.workspace.industry": "Industry",
      "settings.workspace.description": "Description",
      "action.logout": "Logout",
      "action.save": "Save",
      "action.cancel": "Cancel",
      "action.update": "Update",
      "settings.preferences.title": "Preferences",
      "settings.preferences.desc":
        "Toggle single-page view mode and notifications.",
      "settings.preferences.badge": "Instant",
      "settings.preferences.singlePage": "Single-page navigation",
      "settings.preferences.singlePageHint":
        "Show only the selected page and hide other views.",
      "settings.preferences.notifications": "Notifications",
      "settings.preferences.notificationsHint":
        "Quick reminder banners for workspace events.",
      "settings.summary.title": "Workspace summary",
      "settings.summary.desc": "Local key/value mapping saved in your browser.",
      "settings.summary.badge": "Local",
      "settings.summary.workspaceLabel": "Workspace",
      "settings.summary.languageLabel": "Language",
      "settings.summary.timezoneLabel": "Timezone",
      "settings.summary.singlePageLabel": "Single-page view",
      "settings.summary.notificationsLabel": "Notifications",
      "settings.summary.enabled": "Enabled",
      "settings.summary.disabled": "Disabled",

      "error.404.title": "Page not found",
      "error.404.desc":
        "The link you followed does not exist. Choose a section to continue.",
      "error.404.cta": "Back to workspace",
      "error.404.back": "Return to dashboard",

      "demo.label": "Live preview",
      "demo.title": "Board ready for handoff",
      "demo.desc":
        "Explore a pre-filled workspace with KPIs, pipeline, and mini-invoices. Connect your Supabase keys later to sync real data.",
      "demo.ctaPrimary": "Connect account",
      "demo.ctaSecondary": "Explore layout",

      "card.metrics.title": "Key metrics",
      "card.metrics.desc":
        "Quick view of revenue, open invoices and current workload.",
      "card.metrics.range": "Last 30 days",
      "kpi.billed.label": "Billed (30d)",
      "kpi.billed.trend": "Based on paid invoices",
      "kpi.openInvoices.label": "Open invoices",
      "kpi.openInvoices.trend": "Sent & overdue",
      "kpi.clients.label": "Active clients",
      "kpi.clients.trend": "From Supabase CRM",
      "kpi.tasks.label": "Tasks today",
      "kpi.tasks.trend": "Linked to projects",

      "card.tasks.title": "Tasks & follow-ups",
      "card.tasks.desc":
        "What needs your attention today across projects and clients.",
      "card.tasks.source": "From Supabase",

      "card.pipeline.title": "Client & project pipeline",
      "card.pipeline.desc": "From new leads to active builds and maintenance.",

      "card.miniInvoices.title": "Mini invoices",
      "card.miniInvoices.desc": "Simple quick invoices — integration pending.",
      "card.miniInvoices.badge": "Integration required",
      "mini.meta.count": "Invoices in view",
      "mini.meta.total": "Total amount",
      "mini.meta.local": "Local only",
      "mini.badgeDemo": "Local demo mode",
      "mini.required": "Client and a valid amount are required.",
      "mini.untitled": "Untitled invoice",
      "mini.saved": "Saved locally. Connect Supabase to sync later.",
      "mini.none": "No invoices yet. Add your first one.",

      "card.automations.title": "Automations",
      "card.automations.desc":
        "Light rules that keep your admin moving in the background.",
      "card.automations.badge": "Preview",
      "auto.followUp": "Follow up on unpaid invoices",
      "auto.followUpDesc": "Send a reminder 7 days after due date.",
      "auto.clientAlert": "Flag silent clients",
      "auto.clientAlertDesc": "Notify when there is no activity for 14 days.",
      "auto.taskBalance": "Balance workload",
      "auto.taskBalanceDesc": "Reassign tasks when one person is overloaded.",

      "card.clients.title": "Clients",
      "card.clients.desc":
        "Manage the contacts that power your projects and invoices.",
      "card.clients.badge": "Live CRM",

      "form.clientName": "Client name",
      "form.email": "Email",
      "form.company": "Company",
      "form.phone": "Phone",
      "form.notes": "Notes",
      "form.amount": "Amount (€)",
      "form.shortDescription": "Short description",
      "form.draft": "Draft",
      "form.sent": "Sent",
      "form.paid": "Paid",
      "form.addInvoice": "Add invoice",
      "form.addClient": "Add client",
      "form.saveClient": "Save client",
      "form.updateClient": "Update client",
      "form.saveInvoice": "Save invoice",
      "form.updateInvoice": "Update invoice",

      "table.client": "Client",
      "table.label": "Label",
      "table.amount": "Amount",
      "table.status": "Status",
      "table.name": "Name",
      "table.company": "Company",
      "table.email": "Email",
      "table.phone": "Phone",
      "table.actions": "Actions",

      "smart.hero.kicker": "Smart surface",
      "smart.hero.title": "One panel to delegate the busywork",
      "smart.hero.desc":
        "Blend CRM data, invoice history, and tasks to get tailored prompts for prospecting, renewals, and project delivery.",
      "smart.hero.primary": "Launch assistant",
      "smart.hero.secondary": "View prompt library",
      "smart.cards.brief.title": "Client brief",
      "smart.cards.brief.desc":
        "Auto-build a 200-word summary from CRM fields, recent tasks, and unpaid invoices.",
      "smart.cards.outreach.title": "Smart outreach",
      "smart.cards.outreach.desc":
        "Draft a follow-up message with suggested subject lines and a call-to-action.",
      "smart.cards.action.title": "Next-best action",
      "smart.cards.action.desc":
        "Combine pipeline, tasks, and MRR impact to suggest what to do first today.",

      "insights.hero.kicker": "Decision cockpit",
      "insights.hero.title": "See the signals behind your KPIs",
      "insights.hero.desc":
        "Track revenue momentum, deal velocity, and workload saturation with annotated insights.",
      "insights.hero.primary": "Export snapshot",
      "insights.hero.secondary": "Schedule email",
      "insights.tiles.revenue.label": "Revenue pace",
      "insights.tiles.revenue.desc":
        "Projected this quarter with uplift from retained clients.",
      "insights.tiles.revenue.chip1": "Top-up needed: € 7.5k",
      "insights.tiles.revenue.chip2": "3 open renewals",
      "insights.tiles.pipeline.label": "Pipeline health",
      "insights.tiles.pipeline.desc":
        "Coverage vs. target across lead → ongoing stages.",
      "insights.tiles.pipeline.chip1": "2 deals stuck 14d",
      "insights.tiles.pipeline.chip2": "Add 1 discovery",
      "insights.tiles.team.label": "Team load",
      "insights.tiles.team.desc":
        "Based on tasks due this week and retainer SLAs.",
      "insights.tiles.team.chip1": "2 tasks overdue",
      "insights.tiles.team.chip2": "Shift Atlas Labs",

      "support.hero.kicker": "Operator kit",
      "support.hero.title": "Handbook pages you can hand to the team",
      "support.hero.desc":
        "Each SOP ships with a checklist, owner, and links to the exact tables it touches.",
      "support.hero.primary": "Download playbook",
      "support.hero.secondary": "Share workspace guide",
      "support.cards.invoice.title": "Invoice hygiene",
      "support.cards.invoice.desc":
        "Weekly sweep that checks overdue items, recent payments, and retainer caps.",
      "support.cards.invoice.chip1": "Owner: Finance",
      "support.cards.invoice.chip2": "10 min",
      "support.cards.crm.title": "CRM intake",
      "support.cards.crm.desc":
        "How to qualify new leads, add discovery notes, and route them into the pipeline.",
      "support.cards.crm.chip1": "Owner: Ops",
      "support.cards.crm.chip2": "15 min",
      "support.cards.tasks.title": "Task triage",
      "support.cards.tasks.desc":
        "When to mark blockers, escalate, or convert a task into a billable change request.",
      "support.cards.tasks.chip1": "Owner: Delivery",
      "support.cards.tasks.chip2": "8 min",

      "auth.login.title": "Login",
      "auth.login.subtitle": "Access your MHM UBA workspace.",
      "auth.login.button": "Login",
      "auth.login.prompt": "Don’t have an account?",
      "auth.login.link": "Create one",
      "auth.login.missing": "Please fill in both email and password.",
      "auth.login.failed": "Login failed.",
      "auth.login.network": "Network or server error. Please try again.",

      "auth.signup.title": "Create your account",
      "auth.signup.subtitle":
        "One workspace for clients, tasks, invoices and automations.",
      "auth.signup.button": "Create account",
      "auth.signup.prompt": "Already have an account?",
      "auth.signup.link": "Back to login",
      "auth.signup.missing": "Please fill in all fields.",
      "auth.signup.mismatch": "Passwords do not match.",
      "auth.signup.failed": "Sign up failed.",
      "auth.signup.confirmation":
        "Account created. Please check your email to confirm.",
      "auth.signup.successRedirect":
        "Account created successfully. Redirecting...",

      "auth.email.label": "Email",
      "auth.email.placeholder": "you@example.com",
      "auth.password.label": "Password",
      "auth.password.placeholder": "Password",
      "auth.confirmPassword.label": "Confirm password",
      "auth.confirmPassword.placeholder": "Repeat password",

      "errors.form": "Form error. Please reload the page.",
      "errors.network": "Network or server error. Please try again.",
      "errors.logout": "Logout failed. Please try again.",

      "clients.demoMessage":
        "Sign in to sync CRM data. The demo keeps everything local.",
      "clients.loading": "Loading...",
      "clients.none": "No clients yet. Add your first client.",
      "clients.deleteConfirm": "Delete this client?",
      "errors.loadClients": "Failed to load clients.",
      "errors.deleteClient": "Failed to delete client.",
      "action.delete": "Delete",
      "smart.client.select": "Select client",
      "smart.client.selectPrompt": "Select a client to view a brief.",
      "smart.client.lastActivity": "Last activity",
      "smart.client.noActivity": "No recent activity",
      "smart.client.openInvoices": "Open invoices",
      "smart.client.activeProjects": "Active projects",
      "smart.client.recentTasks": "Recent tasks",
      "tool.outreach.hint": "Select a client to see outreach suggestions.",
      "tool.outreach.empty": "No suggestions at the moment.",
      "tool.actions.empty": "No immediate actions",
      "tool.insights.title": "Quick insights",
      "tool.insights.topClients": "Top clients",
      "tool.insights.overdueTasks": "Overdue tasks",
      "tool.insights.overdueLabel": "overdue",
      "tool.insights.topExpense": "Top expense",
      "action.edit": "Edit",
    },
    ar: {
      assistant_title: "UBA Assistant",
      assistant_subtitle: "Ask UBA Assistant for guidance and quick tips.",
      assistant_placeholder: "Ask a question…",
      "language.label": "اللغة",
      "language.en": "الإنجليزية",
      "language.ar": "العربية",
      "language.nl": "الهولندية",
      "language.fr": "الفرنسية",
      "language.es": "الإسبانية",
      "language.de": "الألمانية",

      "app.tagline":
        "مؤتمت الأعمال الشامل — مساحة عمل واحدة للعملاء والمهام والفواتير والأدوات الذكية.",
      "app.badge": "نسخة تجريبية خاصة · صُنعت في هولندا",
      "sidebar.footer":
        "مصممة للفرق الصغيرة والمؤسسين المنفردين الذين سئموا من استخدام سبعة أدوات لتشغيل عمل واحد.",
      "top.kicker": "مساحة العمل",

      "nav.workspaceLabel": "مساحة العمل",
      "nav.dashboard": "لوحة التحكم",
      "nav.dashboardSub": "نظرة عامة",
      "nav.clients": "العملاء",
      "nav.clientsSub": "إدارة علاقات العملاء",
      "nav.projects": "المشاريع",
      "nav.projectsSub": "خط المبيعات",
      "nav.tasks": "المهام",
      "nav.tasksSub": "اليوم",
      "nav.invoices": "الفواتير",
      "nav.invoicesSub": "الفوترة",
      "nav.automations": "الأتمتة",
      "nav.automationsSub": "التدفقات",
      "nav.smartTools": "أدوات UBA الذكية",
      "nav.smartToolsSub": "تشغيل آلي",
      "nav.insights": "مختبر الرؤى",
      "nav.insightsSub": "التقارير",
      "nav.support": "مكتب النجاح",
      "nav.supportSub": "الإرشاد",
      "nav.settings": "الإعدادات",
      "nav.settingsSub": "المساحة",

      "view.dashboard.title": "نظرة الأعمال",
      "view.dashboard.desc":
        "ملخص اليوم عبر العملاء والفواتير والمهام والأتمتة.",
      "view.projects.title": "المشاريع",
      "view.projects.desc": "عرض خط المبيعات من جدول المشاريع في Supabase.",
      "view.projects.note":
        "يتم استخدام المشاريع بالفعل لمؤشرات الأداء والخط. لاحقًا يمكننا بناء إنشاء وتحرير كامل هنا.",
      "projects.add": "أضف مشروعًا",
      "projects.modal.title": "المشروع",
      "projects.modal.sub": "أنشئ أو حرر مشروعًا",
      "projects.form.titlePlaceholder": "عنوان المشروع",
      "projects.form.clientPlaceholder": "العميل",
      "projects.form.budgetPlaceholder": "الميزانية",
      "projects.form.notesPlaceholder": "ملاحظات (اختياري)",
      "projects.form.cancel": "إلغاء",
      "projects.form.save": "حفظ",
      "view.tasks.title": "المهام",
      "view.tasks.desc": "لوحة مهام مفصلة (قريبًا).",
      "view.tasks.note":
        "يتم عرض المهام المختصرة على لوحة التحكم بالفعل من جدول المهام في Supabase.",
      "view.invoices.title": "الفواتير",
      "view.invoices.desc":
        "إدارة فواتير كاملة مدعومة بجدول الفواتير في Supabase.",
      "view.invoices.note":
        "تعتمد مؤشرات الأداء بالفعل على فواتيرك. هذا القسم سيسمح لاحقًا بإنشاء وتحرير كامل.",
      "view.automations.title": "الأتمتة",
      "view.automations.desc": "أنشئ تدفقات تربط العملاء والفواتير والمهام.",
      "view.automations.note":
        "عنصر نائب لمنطق الأتمتة. يمكننا لاحقًا تخزين التدفقات كـ JSON في Supabase.",
      "view.calendar.title": "التقويم",
      "view.calendar.desc": "نظرة شهرية على المهام والمواعيد النهائية والأحداث.",
      "view.smartTools.title": "أدوات UBA الذكية",
      "view.smartTools.desc":
        "مساعدات ذكاء اصطناعي تلخص سياق العملاء وتكتب رسائل المتابعة وتقترح الخطوة التالية.",
      "view.smartTools.badge": "مفاهيم مباشرة",
      "view.insights.title": "مختبر الرؤى",
      "view.insights.desc":
        "لوحات سردية للمؤسسين: اتجاهات ومخاطر وفرص سريعة بنظرة واحدة.",
      "view.insights.badge": "معاينة",
      "view.support.title": "مكتب النجاح",
      "view.support.desc":
        "إرشادات وقوالب وإجراءات صغيرة للحفاظ على مساحة العمل واضحة ومتسقة.",
      "view.support.badge": "جاهز",
      "view.settings.title": "الإعدادات",
      "view.settings.desc": "تفضيلات مساحة العمل وإعدادات اللغة الافتراضية.",
      "view.settings.note": "يتم حفظ التفضيلات محليًا في هذا المتصفح.",
      "view.invoices.kicker": "المالية",
      "invoices.open": "مفتوح:",
      "invoices.paid": "مدفوع:",
      "invoices.overdue": "متأخر:",
      "invoices.empty": "لا توجد فواتير بعد.",
      "btn.newInvoice": "فاتورة جديدة",
      "btn.newAutomation": "أتمتة جديدة",
      "view.automations.empty":
        "لا توجد أتمتات بعد. أنشئ أول تدفق باستخدام المشغلات والإجراءات.",
      "view.smartTools.kicker": "أدوات",
      "btn.exploreTools": "استكشاف الأدوات",
      "view.insights.kicker": "الرؤى",
      "view.insights.empty":
        "ستظهر الرؤى هنا: اتجاهات الإيرادات وتوزيع العملاء والتنبيهات.",
      "view.settings.kicker": "الإعدادات",
      "view.settings.configure": "قم بتكوين مساحة العمل والفوترة والتكاملات.",

      "insights.panels.title": "لوحات التحليلات",
      "insights.panels.desc": "بطاقات UBA جاهزة لمؤشراتك والتعليقات والتصدير.",
      "insights.panels.badge": "محلي فقط",
      "insights.panels.revenue.title": "مسار الإيرادات",
      "insights.panels.revenue.desc":
        "تصور التجديدات القادمة وإجمالي الفوترة للقراءة السريعة.",
      "insights.panels.revenue.tag": "عنصر نائب €",
      "insights.panels.clients.title": "زخم العملاء",
      "insights.panels.clients.desc":
        "تتبع الصفقات الجديدة ومخاطر الإلغاء ومتوسط سرعة الإغلاق.",
      "insights.panels.clients.tag": "عنصر نائب CRM",
      "insights.panels.projects.title": "تدفق المشاريع",
      "insights.panels.projects.desc":
        "ارسم المسار من العميل المحتمل إلى التسليم والدعم لإبراز الاختناقات.",
      "insights.panels.projects.tag": "عنصر نائب للخط",
      "insights.panels.workload.title": "توازن عبء العمل",
      "insights.panels.workload.desc":
        "قارن عبء المهام لكل مالك باستخدام مخطط عنصر نائب بسيط.",
      "insights.panels.workload.tag": "عنصر نائب للعمليات",
      "insights.brief.title": "موجز سردي",
      "insights.brief.desc":
        "كُتل قصصية بسيطة لإبقاء أصحاب المصلحة على نفس الصفحة.",
      "insights.brief.badge": "عنصر نائب",
      "insights.brief.items.readout.title": "ملخص الإشارات",
      "insights.brief.items.readout.desc":
        "استخدم هذا الجزء لتلخيص ما تغير في السبرينت الأخير.",
      "insights.brief.items.nextSteps.title": "الخطوات التالية",
      "insights.brief.items.nextSteps.desc":
        "سرد التجارب أو المتابعات قبل مشاركة التصدير.",
      "insights.brief.items.risks.title": "المخاطر",
      "insights.brief.items.risks.desc":
        "أشر إلى المعيقات أو المتأخرات أو فجوات البيانات قبل العرض.",

      "settings.workspace.title": "إعدادات مساحة العمل",
      "settings.workspace.desc": "احفظ تفضيلات المساحة محليًا.",
      "settings.workspace.badge": "محلي فقط",
      "settings.workspace.name": "اسم مساحة العمل",
      "settings.workspace.placeholder": "سمِّ مساحتك",
      "settings.workspace.timezone": "المنطقة الزمنية",
      "settings.workspace.language": "اللغة الافتراضية",
      "settings.workspace.save": "حفظ التفضيلات",
      "settings.workspace.status": "غير محفوظ",
      "settings.workspace.saved": "تم الحفظ",
      "settings.profile.title": "الملف الشخصي",
      "settings.profile.name": "الاسم",
      "settings.profile.email": "البريد الإلكتروني",
      "settings.workspace.industry": "الصناعة",
      "settings.workspace.description": "الوصف",
      "action.logout": "تسجيل الخروج",
      "settings.preferences.title": "التفضيلات",
      "settings.preferences.desc": "تفعيل وضع الصفحة الواحدة والإشعارات.",
      "settings.preferences.badge": "فوري",
      "settings.preferences.singlePage": "تنقل صفحة واحدة",
      "settings.preferences.singlePageHint":
        "إظهار الصفحة المحددة فقط وإخفاء العروض الأخرى.",
      "settings.preferences.notifications": "الإشعارات",
      "settings.preferences.notificationsHint":
        "تنبيهات سريعة لأحداث مساحة العمل.",
      "settings.summary.title": "ملخص المساحة",
      "settings.summary.desc": "تخزين مفاتيح/قيم محلي في متصفحك.",
      "settings.summary.badge": "محلي",
      "settings.summary.workspaceLabel": "المساحة",
      "settings.summary.languageLabel": "اللغة",
      "settings.summary.timezoneLabel": "المنطقة الزمنية",
      "settings.summary.singlePageLabel": "عرض صفحة واحدة",
      "settings.summary.notificationsLabel": "الإشعارات",
      "settings.summary.enabled": "مفعّل",
      "settings.summary.disabled": "معطّل",

      "error.404.title": "الصفحة غير موجودة",
      "error.404.desc": "الرابط الذي اتبعته غير موجود. اختر قسمًا للمتابعة.",
      "error.404.cta": "العودة إلى المساحة",
      "error.404.back": "الرجوع إلى لوحة التحكم",

      "demo.label": "معاينة مباشرة",
      "demo.title": "لوحة جاهزة للتسليم",
      "demo.desc":
        "استكشف مساحة عمل مجهزة بمؤشرات الأداء وخط المبيعات وفواتير مصغرة. اربط مفاتيح Supabase لاحقًا لمزامنة البيانات الحقيقية.",
      "demo.ctaPrimary": "ربط الحساب",
      "demo.ctaSecondary": "استكشاف التخطيط",

      "card.metrics.title": "المؤشرات الرئيسية",
      "card.metrics.desc":
        "نظرة سريعة على الإيرادات والفواتير المفتوحة وحجم العمل الحالي.",
      "card.metrics.range": "آخر 30 يومًا",
      "kpi.billed.label": "المفوتر (30ي)",
      "kpi.billed.trend": "استنادًا إلى الفواتير المدفوعة",
      "kpi.openInvoices.label": "الفواتير المفتوحة",
      "kpi.openInvoices.trend": "مرسلة ومتأخرة",
      "kpi.clients.label": "العملاء النشطون",
      "kpi.clients.trend": "من CRM Supabase",
      "kpi.tasks.label": "مهام اليوم",
      "kpi.tasks.trend": "مرتبطة بالمشاريع",

      "card.tasks.title": "المهام والمتابعات",
      "card.tasks.desc": "ما يحتاج انتباهك اليوم عبر المشاريع والعملاء.",
      "card.tasks.source": "من Supabase",

      "card.pipeline.title": "خط العملاء والمشاريع",
      "card.pipeline.desc": "من العملاء المحتملين إلى البناء والصيانة.",

      "card.miniInvoices.title": "الفواتير المصغرة",
      "card.miniInvoices.desc": "فواتير سريعة بسيطة — التكامل قيد الانتظار.",
      "card.miniInvoices.badge": "يلزم التكامل",
      "mini.meta.count": "الفواتير في العرض",
      "mini.meta.total": "إجمالي المبلغ",
      "mini.meta.local": "محلي فقط",
      "mini.badgeDemo": "وضع العرض المحلي",
      "mini.required": "يلزم اسم العميل ومبلغ صالح.",
      "mini.untitled": "فاتورة بلا عنوان",
      "mini.saved": "تم الحفظ محليًا. اربط Supabase للمزامنة لاحقًا.",
      "mini.none": "لا توجد فواتير بعد. أضف أول فاتورة.",

      "card.automations.title": "الأتمتة",
      "card.automations.desc": "قواعد خفيفة تحرك الأعمال في الخلفية.",
      "card.automations.badge": "معاينة",
      "auto.followUp": "متابعة الفواتير غير المدفوعة",
      "auto.followUpDesc": "إرسال تذكير بعد 7 أيام من تاريخ الاستحقاق.",
      "auto.clientAlert": "تنبيه العملاء الصامتين",
      "auto.clientAlertDesc": "إشعار عند عدم وجود نشاط لمدة 14 يومًا.",
      "auto.taskBalance": "موازنة عبء العمل",
      "auto.taskBalanceDesc":
        "إعادة توزيع المهام عند زيادة الحمل على شخص واحد.",

      "card.clients.title": "العملاء",
      "card.clients.desc": "إدارة جهات الاتصال التي تشغل مشاريعك وفواتيرك.",
      "card.clients.badge": "CRM مباشر",

      "form.clientName": "اسم العميل",
      "form.email": "البريد الإلكتروني",
      "form.company": "الشركة",
      "form.phone": "الهاتف",
      "form.notes": "ملاحظات",
      "form.amount": "المبلغ (€)",
      "form.shortDescription": "وصف قصير",
      "form.draft": "مسودة",
      "form.sent": "مرسلة",
      "form.paid": "مدفوعة",
      "form.addInvoice": "إضافة فاتورة",
      "form.addClient": "إضافة عميل",

      "table.client": "العميل",
      "table.label": "الوصف",
      "table.amount": "المبلغ",
      "table.status": "الحالة",
      "table.name": "الاسم",
      "table.company": "الشركة",
      "table.email": "البريد الإلكتروني",
      "table.phone": "الهاتف",
      "table.actions": "إجراءات",

      "smart.hero.kicker": "طبقة ذكية",
      "smart.hero.title": "لوحة واحدة لتفويض الأعمال الشاغلة",
      "smart.hero.desc":
        "ادمج بيانات CRM وتاريخ الفواتير والمهام للحصول على مطالبات مخصصة للتواصل والتجديدات والتسليم.",
      "smart.hero.primary": "تشغيل المساعد",
      "smart.hero.secondary": "عرض مكتبة الطلبات",
      "smart.cards.brief.title": "ملخص العميل",
      "smart.cards.brief.desc":
        "إنشاء ملخص من 200 كلمة من حقول CRM والمهام الأخيرة والفواتير غير المدفوعة.",
      "smart.cards.outreach.title": "متابعة ذكية",
      "smart.cards.outreach.desc":
        "صياغة رسالة متابعة مع عناوين مقترحة ودعوة لاتخاذ إجراء.",
      "smart.cards.action.title": "أفضل خطوة تالية",
      "smart.cards.action.desc":
        "اجمع بين الخط والمهام والأثر المالي لاقتراح أولويات اليوم.",

      "insights.hero.kicker": "قمرة القرارات",
      "insights.hero.title": "رؤية الإشارات خلف مؤشراتك",
      "insights.hero.desc":
        "تتبع زخم الإيرادات وسرعة الصفقات وتشبع عبء العمل مع رؤى مشروحة.",
      "insights.hero.primary": "تصدير لقطة",
      "insights.hero.secondary": "جدولة بريد إلكتروني",
      "insights.tiles.revenue.label": "وتيرة الإيرادات",
      "insights.tiles.revenue.desc":
        "متوقع هذا الربع مع زيادة من العملاء المحتفظ بهم.",
      "insights.tiles.revenue.chip1": "مطلوب تعزيز: € 7.5k",
      "insights.tiles.revenue.chip2": "3 تجديدات مفتوحة",
      "insights.tiles.pipeline.label": "صحة الخط",
      "insights.tiles.pipeline.desc":
        "التغطية مقابل الهدف عبر مراحل العميل المحتمل → الجاري.",
      "insights.tiles.pipeline.chip1": "صفقتان عالقتان 14 يومًا",
      "insights.tiles.pipeline.chip2": "أضف اكتشافًا واحدًا",
      "insights.tiles.team.label": "حِمل الفريق",
      "insights.tiles.team.desc":
        "استنادًا إلى المهام المستحقة هذا الأسبوع واتفاقيات الخدمة.",
      "insights.tiles.team.chip1": "مهمتان متأخرتان",
      "insights.tiles.team.chip2": "انقل Atlas Labs",

      "support.hero.kicker": "عدة التشغيل",
      "support.hero.title": "صفحات كتيب يمكنك تسليمها للفريق",
      "support.hero.desc":
        "يحمل كل إجراء قائمة تحقق ومالكًا وروابط للجداول التي يتعامل معها.",
      "support.hero.primary": "تنزيل الكتيب",
      "support.hero.secondary": "مشاركة دليل المساحة",
      "support.cards.invoice.title": "نظافة الفواتير",
      "support.cards.invoice.desc":
        "مراجعة أسبوعية تتحقق من المتأخرات والمدفوعات الأخيرة وحدود العقود.",
      "support.cards.invoice.chip1": "المالك: المالية",
      "support.cards.invoice.chip2": "10 دقائق",
      "support.cards.crm.title": "إدخال CRM",
      "support.cards.crm.desc":
        "كيفية تأهيل العملاء الجدد وإضافة ملاحظات الاكتشاف وإدخالهم في الخط.",
      "support.cards.crm.chip1": "المالك: العمليات",
      "support.cards.crm.chip2": "15 دقيقة",
      "support.cards.tasks.title": "فرز المهام",
      "support.cards.tasks.desc":
        "متى تضع علامة الموانع أو تصعد الأمر أو تحوله إلى طلب تغيير قابل للفوترة.",
      "support.cards.tasks.chip1": "المالك: التسليم",
      "support.cards.tasks.chip2": "8 دقائق",

      "auth.login.title": "تسجيل الدخول",
      "auth.login.subtitle": "ادخل إلى مساحة عملك في UBA.",
      "auth.login.button": "تسجيل الدخول",
      "auth.login.prompt": "ليس لديك حساب؟",
      "auth.login.link": "أنشئ حسابًا",
      "auth.login.missing": "يرجى تعبئة البريد الإلكتروني وكلمة المرور.",
      "auth.login.failed": "فشل تسجيل الدخول.",
      "auth.login.network": "خطأ في الشبكة أو الخادم. حاول مرة أخرى.",

      "auth.signup.title": "إنشاء حسابك",
      "auth.signup.subtitle":
        "مساحة عمل واحدة للعملاء والمهام والفواتير والأتمتة.",
      "auth.signup.button": "إنشاء الحساب",
      "auth.signup.prompt": "هل لديك حساب بالفعل؟",
      "auth.signup.link": "العودة لتسجيل الدخول",
      "auth.signup.missing": "يرجى تعبئة جميع الحقول.",
      "auth.signup.mismatch": "كلمتا المرور غير متطابقتين.",
      "auth.signup.failed": "فشل إنشاء الحساب.",
      "auth.signup.confirmation":
        "تم إنشاء الحساب. يرجى التحقق من بريدك الإلكتروني للتأكيد.",
      "auth.signup.successRedirect": "تم إنشاء الحساب بنجاح. جارٍ التحويل...",

      "auth.email.label": "البريد الإلكتروني",
      "auth.email.placeholder": "you@example.com",
      "auth.password.label": "كلمة المرور",
      "auth.password.placeholder": "كلمة المرور",
      "auth.confirmPassword.label": "تأكيد كلمة المرور",
      "auth.confirmPassword.placeholder": "أعد كتابة كلمة المرور",

      "errors.form": "خطأ في النموذج. يرجى إعادة تحميل الصفحة.",
      "errors.network": "خطأ في الشبكة أو الخادم. حاول مرة أخرى.",
      "errors.logout": "فشل تسجيل الخروج. حاول مرة أخرى.",

      "clients.demoMessage":
        "سجّل الدخول لمزامنة بيانات CRM. يحافظ العرض التوضيحي على كل شيء محليًا.",
      "clients.loading": "جارٍ التحميل...",
      "clients.none": "لا يوجد عملاء بعد. أضف عميلك الأول.",
      "clients.deleteConfirm": "هل تريد حذف هذا العميل؟",
      "errors.loadClients": "فشل تحميل العملاء.",
      "errors.deleteClient": "فشل حذف العميل.",
      "action.delete": "حذف",
      "smart.client.select": "Select client",
      "smart.client.selectPrompt": "Select a client to view a brief.",
      "smart.client.lastActivity": "Last activity",
      "smart.client.noActivity": "No recent activity",
      "smart.client.openInvoices": "Open invoices",
      "smart.client.activeProjects": "Active projects",
      "smart.client.recentTasks": "Recent tasks",
      "tool.outreach.hint": "Select a client to see outreach suggestions.",
      "tool.outreach.empty": "No suggestions at the moment.",
      "tool.actions.empty": "No immediate actions",
      "tool.insights.title": "Quick insights",
      "tool.insights.topClients": "Top clients",
      "tool.insights.overdueTasks": "Overdue tasks",
      "tool.insights.overdueLabel": "overdue",
      "tool.insights.topExpense": "Top expense",
    },
    nl: {
      assistant_title: "UBA Assistant",
      assistant_subtitle: "Ask UBA Assistant for guidance and quick tips.",
      assistant_placeholder: "Ask a question…",
      "language.label": "Taal",
      "language.en": "Engels",
      "language.ar": "Arabisch",
      "language.nl": "Nederlands",
      "language.fr": "Frans",
      "language.es": "Spaans",
      "language.de": "Duits",

      "app.tagline":
        "Universal Business Automator — één werkplek voor klanten, taken, facturen en slimme tools.",
      "app.badge": "Private beta · Gebouwd in Nederland",
      "sidebar.footer":
        "Gemaakt voor kleine teams en solo-oprichters die klaar zijn met zeven verschillende tools voor één bedrijf.",
      "top.kicker": "Werkruimte",

      "nav.workspaceLabel": "Werkruimte",
      "nav.dashboard": "Dashboard",
      "nav.dashboardSub": "Overzicht",
      "nav.clients": "Klanten",
      "nav.clientsSub": "CRM",
      "nav.projects": "Projecten",
      "nav.projectsSub": "Pipeline",
      "nav.tasks": "Taken",
      "nav.tasksSub": "Vandaag",
      "nav.invoices": "Facturen",
      "nav.invoicesSub": "Facturatie",
      "nav.automations": "Automaties",
      "nav.automationsSub": "Flows",
      "nav.smartTools": "UBA Smart Tools",
      "nav.smartToolsSub": "AI",
      "nav.insights": "Insights Lab",
      "nav.insightsSub": "Rapporten",
      "nav.support": "Succesdesk",
      "nav.supportSub": "Hulp",
      "nav.settings": "Instellingen",
      "nav.settingsSub": "Werkplek",

      "view.dashboard.title": "Bedrijfsoverzicht",
      "view.dashboard.desc":
        "Dagelijkse momentopname van klanten, facturen, taken en automatiseringen.",
      "view.projects.title": "Projecten",
      "view.projects.desc":
        "Pipelineweergave vanuit de Supabase-projectentabel.",
      "view.projects.note":
        "Projecten worden al gebruikt voor KPI's en pipeline. Later bouwen we hier volledige CRUD.",
      "view.tasks.title": "Taken",
      "view.tasks.desc": "Gedetailleerde takenboard (binnenkort).",
      "view.tasks.note":
        "Samenvatting van taken staat al op het dashboard via de Supabase-taakentabel.",
      "view.invoices.title": "Facturen",
      "view.invoices.desc":
        "Volledig factuurbeheer ondersteund door Supabase-facturen.",
      "view.invoices.note":
        "KPI's zijn al gebaseerd op je facturen. Later komt hier volledige CRUD.",
      "view.automations.title": "Automaties",
      "view.automations.desc":
        "Bouw flows die klanten, facturen en taken verbinden.",
      "view.automations.note":
        "Plaatshouder voor automatiseringslogica. Later kunnen we flows als JSON opslaan in Supabase.",
      "view.calendar.title": "Kalender",
      "view.calendar.desc": "Maandelijks overzicht van taken, deadlines en gebeurtenissen.",
      "view.smartTools.title": "UBA Smart Tools",
      "view.smartTools.desc":
        "AI-hulpen die klantcontext samenvatten, opvolging schrijven en volgende acties voorstellen.",
      "view.smartTools.badge": "Live concepten",
      "view.insights.title": "Insights Lab",
      "view.insights.desc":
        "Narratieve dashboards voor oprichters: trends, risico's en snelle winst in één oogopslag.",
      "view.insights.badge": "Preview",
      "view.support.title": "Succesdesk",
      "view.support.desc":
        "Richtlijnen, templates en micro-SOP's voor een duidelijke werkplek.",
      "view.support.badge": "Klaar",
      "view.settings.title": "Instellingen",
      "view.settings.desc": "Voorkeuren voor werkruimte en taalstandaard.",
      "view.settings.note":
        "Voorkeuren worden lokaal in deze browser opgeslagen.",
      "view.invoices.kicker": "Financiën",
      "invoices.open": "Open:",
      "invoices.paid": "Betaald:",
      "invoices.overdue": "Achterstallig:",
      "invoices.empty": "Nog geen facturen.",
      "btn.newInvoice": "Nieuwe factuur",
      "btn.newAutomation": "Nieuwe automatisering",
      "view.automations.empty":
        "Nog geen automatiseringen. Maak je eerste workflow met triggers en acties.",
      "view.smartTools.kicker": "Hulpmiddelen",
      "btn.exploreTools": "Ontdek tools",
      "view.insights.kicker": "Inzichten",
      "view.insights.empty":
        "Inzichten verschijnen hier: omzettrends, klantverdeling en meldingen.",
      "view.settings.kicker": "Instellingen",
      "view.settings.configure":
        "Configureer je werkruimte, facturering en integraties.",

      "insights.panels.title": "Analytische panelen",
      "insights.panels.desc":
        "UBA-kaarten klaar voor je metrics, annotaties en export.",
      "insights.panels.badge": "Alleen lokaal",
      "insights.panels.revenue.title": "Omzet-runway",
      "insights.panels.revenue.desc":
        "Aankomende verlengingen en gefactureerde totalen voor snelle lezingen.",
      "insights.panels.revenue.tag": "€ placeholder",
      "insights.panels.clients.title": "Klantenmomentum",
      "insights.panels.clients.desc":
        "Volg nieuwe deals, churnrisico's en dealtempo.",
      "insights.panels.clients.tag": "CRM placeholder",
      "insights.panels.projects.title": "Projectflow",
      "insights.panels.projects.desc":
        "Breng lead → levering → support in kaart om knelpunten te zien.",
      "insights.panels.projects.tag": "Pipeline placeholder",
      "insights.panels.workload.title": "Werkdruk balans",
      "insights.panels.workload.desc":
        "Vergelijk taakbelasting per eigenaar met een eenvoudige placeholdergrafiek.",
      "insights.panels.workload.tag": "Ops placeholder",
      "insights.brief.title": "Narratieve samenvatting",
      "insights.brief.desc":
        "Eenvoudige storyblocks om stakeholders gelijk te houden.",
      "insights.brief.badge": "Placeholder",
      "insights.brief.items.readout.title": "Signaaloverzicht",
      "insights.brief.items.readout.desc":
        "Gebruik dit blok om samen te vatten wat er in de laatste sprint veranderde.",
      "insights.brief.items.nextSteps.title": "Volgende stappen",
      "insights.brief.items.nextSteps.desc":
        "Som experimenten of follow-ups op voordat je een export deelt.",
      "insights.brief.items.risks.title": "Risico's",
      "insights.brief.items.risks.desc":
        "Noem blokkades, achterstanden of datagaten voordat je presenteert.",

      "settings.workspace.title": "Werkruimte-instellingen",
      "settings.workspace.desc":
        "Sla lokale voorkeuren voor deze werkruimte op.",
      "settings.workspace.badge": "Alleen lokaal",
      "settings.workspace.name": "Werkruimtenaam",
      "settings.workspace.placeholder": "Geef je werkruimte een naam",
      "settings.workspace.timezone": "Tijdzone",
      "settings.workspace.language": "Standaardtaal",
      "settings.workspace.save": "Voorkeuren opslaan",
      "settings.workspace.status": "Niet opgeslagen",
      "settings.workspace.saved": "Opgeslagen",
      "settings.profile.title": "Profiel",
      "settings.profile.name": "Naam",
      "settings.profile.email": "E-mail",
      "settings.workspace.industry": "Sector",
      "settings.workspace.description": "Beschrijving",
      "action.logout": "Uitloggen",
      "settings.preferences.title": "Voorkeuren",
      "settings.preferences.desc": "Schakel single-page weergave en meldingen.",
      "settings.preferences.badge": "Direct",
      "settings.preferences.singlePage": "Navigatie op één pagina",
      "settings.preferences.singlePageHint":
        "Toon alleen de gekozen pagina en verberg andere views.",
      "settings.preferences.notifications": "Meldingen",
      "settings.preferences.notificationsHint":
        "Korte herinneringen voor werkruimte-events.",
      "settings.summary.title": "Werkruimte-overzicht",
      "settings.summary.desc":
        "Lokale key/value mapping opgeslagen in je browser.",
      "settings.summary.badge": "Lokaal",
      "settings.summary.workspaceLabel": "Werkruimte",
      "settings.summary.languageLabel": "Taal",
      "settings.summary.timezoneLabel": "Tijdzone",
      "settings.summary.singlePageLabel": "Single-page view",
      "settings.summary.notificationsLabel": "Meldingen",
      "settings.summary.enabled": "Ingeschakeld",
      "settings.summary.disabled": "Uitgeschakeld",

      "error.404.title": "Pagina niet gevonden",
      "error.404.desc":
        "De link die je volgde bestaat niet. Kies een sectie om verder te gaan.",
      "error.404.cta": "Terug naar werkruimte",
      "error.404.back": "Terug naar dashboard",

      "demo.label": "Live preview",
      "demo.title": "Bord klaar voor overdracht",
      "demo.desc":
        "Verken een ingevulde werkplek met KPI's, pipeline en mini-facturen. Koppel later je Supabase-sleutels om echte data te synchroniseren.",
      "demo.ctaPrimary": "Account koppelen",
      "demo.ctaSecondary": "Bekijk layout",

      "card.metrics.title": "Belangrijkste cijfers",
      "card.metrics.desc":
        "Snel overzicht van omzet, openstaande facturen en huidige werklast.",
      "card.metrics.range": "Laatste 30 dagen",
      "kpi.billed.label": "Gefactureerd (30d)",
      "kpi.billed.trend": "Gebaseerd op betaalde facturen",
      "kpi.openInvoices.label": "Open facturen",
      "kpi.openInvoices.trend": "Verzonden & achterstallig",
      "kpi.clients.label": "Actieve klanten",
      "kpi.clients.trend": "Uit Supabase CRM",
      "kpi.tasks.label": "Taken vandaag",
      "kpi.tasks.trend": "Gekoppeld aan projecten",

      "card.tasks.title": "Taken & opvolging",
      "card.tasks.desc":
        "Wat vandaag je aandacht nodig heeft over projecten en klanten.",
      "card.tasks.source": "Uit Supabase",

      "card.pipeline.title": "Klant- en projectpipeline",
      "card.pipeline.desc": "Van nieuwe leads tot actieve builds en onderhoud.",

      "card.miniInvoices.title": "Mini-facturen",
      "card.miniInvoices.desc":
        "Eenvoudige snelle facturen — integratie volgt.",
      "card.miniInvoices.badge": "Integratie vereist",
      "mini.meta.count": "Facturen in beeld",
      "mini.meta.total": "Totaalbedrag",
      "mini.meta.local": "Alleen lokaal",
      "mini.badgeDemo": "Lokale demomodus",
      "mini.required": "Klant en een geldig bedrag zijn verplicht.",
      "mini.untitled": "Naamloze factuur",
      "mini.saved":
        "Lokaal opgeslagen. Koppel Supabase om later te synchroniseren.",
      "mini.none": "Nog geen facturen. Voeg de eerste toe.",

      "card.automations.title": "Automaties",
      "card.automations.desc":
        "Lichte regels die je administratie op de achtergrond laten lopen.",
      "card.automations.badge": "Preview",
      "auto.followUp": "Opvolgen van onbetaalde facturen",
      "auto.followUpDesc": "Stuur een herinnering 7 dagen na vervaldatum.",
      "auto.clientAlert": "Stille klanten signaleren",
      "auto.clientAlertDesc":
        "Meld wanneer 14 dagen geen activiteit is geweest.",
      "auto.taskBalance": "Werkdruk balanceren",
      "auto.taskBalanceDesc": "Herassign taken wanneer iemand overbelast is.",

      "card.clients.title": "Klanten",
      "card.clients.desc":
        "Beheer de contacten die je projecten en facturen dragen.",
      "card.clients.badge": "Live CRM",

      "form.clientName": "Klantnaam",
      "form.email": "E-mail",
      "form.company": "Bedrijf",
      "form.phone": "Telefoon",
      "form.notes": "Notities",
      "form.amount": "Bedrag (€)",
      "form.shortDescription": "Korte beschrijving",
      "form.draft": "Concept",
      "form.sent": "Verzonden",
      "form.paid": "Betaald",
      "form.addInvoice": "Factuur toevoegen",
      "form.addClient": "Klant toevoegen",

      "table.client": "Klant",
      "table.label": "Label",
      "table.amount": "Bedrag",
      "table.status": "Status",
      "table.name": "Naam",
      "table.company": "Bedrijf",
      "table.email": "E-mail",
      "table.phone": "Telefoon",
      "table.actions": "Acties",

      "smart.hero.kicker": "Slimme laag",
      "smart.hero.title": "Eén paneel om het werk uit te besteden",
      "smart.hero.desc":
        "Combineer CRM-data, factuurhistorie en taken voor gerichte suggesties voor outreach, verlengingen en levering.",
      "smart.hero.primary": "Start assistent",
      "smart.hero.secondary": "Bekijk promptbibliotheek",
      "smart.cards.brief.title": "Klantprofiel",
      "smart.cards.brief.desc":
        "Bouw automatisch een samenvatting van 200 woorden uit CRM-velden, recente taken en onbetaalde facturen.",
      "smart.cards.outreach.title": "Slimme outreach",
      "smart.cards.outreach.desc":
        "Stel een opvolgbericht op met voorgestelde onderwerpen en call-to-action.",
      "smart.cards.action.title": "Beste volgende stap",
      "smart.cards.action.desc":
        "Combineer pipeline, taken en omzetimpact om te adviseren wat eerst te doen.",

      "insights.hero.kicker": "Besliscockpit",
      "insights.hero.title": "Zie de signalen achter je KPI's",
      "insights.hero.desc":
        "Volg omzettempo, dealsnelheid en werkdruk met toegelichte inzichten.",
      "insights.hero.primary": "Snapshot exporteren",
      "insights.hero.secondary": "E-mail plannen",
      "insights.tiles.revenue.label": "Omzettempo",
      "insights.tiles.revenue.desc":
        "Geprojecteerd dit kwartaal met stijging door behoud van klanten.",
      "insights.tiles.revenue.chip1": "Aanvulling nodig: € 7,5k",
      "insights.tiles.revenue.chip2": "3 open verlengingen",
      "insights.tiles.pipeline.label": "Pipelinegezondheid",
      "insights.tiles.pipeline.desc":
        "Coverage t.o.v. target over lead → lopend.",
      "insights.tiles.pipeline.chip1": "2 deals vast 14d",
      "insights.tiles.pipeline.chip2": "Voeg 1 discovery toe",
      "insights.tiles.team.label": "Teamload",
      "insights.tiles.team.desc": "Gebaseerd op taken deze week en SLA's.",
      "insights.tiles.team.chip1": "2 taken te laat",
      "insights.tiles.team.chip2": "Verplaats Atlas Labs",

      "support.hero.kicker": "Operator kit",
      "support.hero.title": "Handboekpagina's voor het team",
      "support.hero.desc":
        "Elke SOP bevat een checklist, eigenaar en links naar de relevante tabellen.",
      "support.hero.primary": "Playbook downloaden",
      "support.hero.secondary": "Werkruimtegids delen",
      "support.cards.invoice.title": "Factuurhygiëne",
      "support.cards.invoice.desc":
        "Wekelijkse check van achterstanden, recente betalingen en retainerlimieten.",
      "support.cards.invoice.chip1": "Eigenaar: Finance",
      "support.cards.invoice.chip2": "10 min",
      "support.cards.crm.title": "CRM intake",
      "support.cards.crm.desc":
        "Hoe nieuwe leads kwalificeren, notities toevoegen en in de pipeline plaatsen.",
      "support.cards.crm.chip1": "Eigenaar: Ops",
      "support.cards.crm.chip2": "15 min",
      "support.cards.tasks.title": "Taaktriage",
      "support.cards.tasks.desc":
        "Wanneer blokkades markeren, escaleren of omzetten naar een factureerbare wijziging.",
      "support.cards.tasks.chip1": "Eigenaar: Delivery",
      "support.cards.tasks.chip2": "8 min",

      "auth.login.title": "Inloggen",
      "auth.login.subtitle": "Toegang tot je MHM UBA-werkplek.",
      "auth.login.button": "Inloggen",
      "auth.login.prompt": "Nog geen account?",
      "auth.login.link": "Maak er een",
      "auth.login.missing": "Vul e-mail en wachtwoord in.",
      "auth.login.failed": "Inloggen mislukt.",
      "auth.login.network": "Netwerk- of serverfout. Probeer opnieuw.",

      "auth.signup.title": "Maak je account",
      "auth.signup.subtitle":
        "Eén werkplek voor klanten, taken, facturen en automatisering.",
      "auth.signup.button": "Account aanmaken",
      "auth.signup.prompt": "Heb je al een account?",
      "auth.signup.link": "Terug naar inloggen",
      "auth.signup.missing": "Vul alle velden in.",
      "auth.signup.mismatch": "Wachtwoorden komen niet overeen.",
      "auth.signup.failed": "Account aanmaken mislukt.",
      "auth.signup.confirmation":
        "Account aangemaakt. Controleer je e-mail om te bevestigen.",
      "auth.signup.successRedirect":
        "Account succesvol aangemaakt. Doorverwijzen...",

      "auth.email.label": "E-mail",
      "auth.email.placeholder": "you@example.com",
      "auth.password.label": "Wachtwoord",
      "auth.password.placeholder": "Wachtwoord",
      "auth.confirmPassword.label": "Bevestig wachtwoord",
      "auth.confirmPassword.placeholder": "Herhaal wachtwoord",

      "errors.form": "Formulierfout. Herlaad de pagina.",
      "errors.network": "Netwerk- of serverfout. Probeer opnieuw.",
      "errors.logout": "Uitloggen mislukt. Probeer opnieuw.",

      "clients.demoMessage":
        "Log in om CRM-gegevens te synchroniseren. De demo houdt alles lokaal.",
      "clients.loading": "Laden...",
      "clients.none": "Nog geen klanten. Voeg je eerste klant toe.",
      "clients.deleteConfirm": "Deze klant verwijderen?",
      "errors.loadClients": "Laden van klanten mislukt.",
      "errors.deleteClient": "Verwijderen van klant mislukt.",
      "action.delete": "Verwijderen",
      "smart.client.select": "Select client",
      "smart.client.selectPrompt": "Select a client to view a brief.",
      "smart.client.lastActivity": "Last activity",
      "smart.client.noActivity": "No recent activity",
      "smart.client.openInvoices": "Open invoices",
      "smart.client.activeProjects": "Active projects",
      "smart.client.recentTasks": "Recent tasks",
      "tool.outreach.hint": "Select a client to see outreach suggestions.",
      "tool.outreach.empty": "No suggestions at the moment.",
      "tool.actions.empty": "No immediate actions",
      "tool.insights.title": "Quick insights",
      "tool.insights.topClients": "Top clients",
      "tool.insights.overdueTasks": "Overdue tasks",
      "tool.insights.overdueLabel": "overdue",
      "tool.insights.topExpense": "Top expense",
    },
    fr: {
      assistant_title: "UBA Assistant",
      assistant_subtitle: "Ask UBA Assistant for guidance and quick tips.",
      assistant_placeholder: "Ask a question…",
      "language.label": "Langue",
      "language.en": "Anglais",
      "language.ar": "Arabe",
      "language.nl": "Néerlandais",
      "language.fr": "Français",
      "language.es": "Espagnol",
      "language.de": "Allemand",

      "app.tagline":
        "Automatisation d'entreprise universelle — un seul espace pour clients, tâches, factures et outils intelligents.",
      "app.badge": "Bêta privée · Conçu aux Pays-Bas",
      "sidebar.footer":
        "Conçu pour les petites équipes et les fondateurs solo lassés d'utiliser sept outils pour un seul business.",
      "top.kicker": "Espace de travail",

      "nav.workspaceLabel": "Espace de travail",
      "nav.dashboard": "Tableau de bord",
      "nav.dashboardSub": "Vue d'ensemble",
      "nav.clients": "Clients",
      "nav.clientsSub": "CRM",
      "nav.projects": "Projets",
      "nav.projectsSub": "Pipeline",
      "nav.tasks": "Tâches",
      "nav.tasksSub": "Aujourd'hui",
      "nav.invoices": "Factures",
      "nav.invoicesSub": "Facturation",
      "nav.automations": "Automations",
      "nav.automationsSub": "Flux",
      "nav.smartTools": "Outils UBA",
      "nav.smartToolsSub": "Ops IA",
      "nav.insights": "Insights Lab",
      "nav.insightsSub": "Rapports",
      "nav.support": "Bureau succès",
      "nav.supportSub": "Guides",
      "nav.settings": "Paramètres",
      "nav.settingsSub": "Espace",

      "view.dashboard.title": "Vue d'entreprise",
      "view.dashboard.desc":
        "Instantané du jour sur vos clients, factures, tâches et automatisations.",
      "view.projects.title": "Projets",
      "view.projects.desc": "Vue pipeline depuis la table projets Supabase.",
      "view.projects.note":
        "Les projets alimentent déjà les KPI et le pipeline. Nous construirons plus tard le CRUD complet ici.",
      "view.tasks.title": "Tâches",
      "view.tasks.desc": "Tableau de tâches détaillé (bientôt).",
      "view.tasks.note":
        "Les tâches résumées sont déjà sur le tableau de bord via Supabase.",
      "view.invoices.title": "Factures",
      "view.invoices.desc":
        "Gestion complète des factures soutenue par Supabase.",
      "view.invoices.note":
        "Les KPI se basent déjà sur vos factures. Cette section offrira plus tard un CRUD complet.",
      "view.automations.title": "Automations",
      "view.automations.desc":
        "Construisez des flux reliant clients, factures et tâches.",
      "view.automations.note":
        "Emplacement réservé pour la logique d'automatisation. Nous stockerons plus tard les flux en JSON dans Supabase.",
      "view.calendar.title": "Calendrier",
      "view.calendar.desc": "Vue mensuelle des tâches, échéances et événements.",
      "view.smartTools.title": "Outils UBA",
      "view.smartTools.desc":
        "Assistants IA qui résument le contexte client, rédigent les suivis et suggèrent la prochaine action.",
      "view.smartTools.badge": "Concepts actifs",
      "view.insights.title": "Insights Lab",
      "view.insights.desc":
        "Tableaux narratifs pour fondateurs : tendances, risques et gains rapides en un coup d'œil.",
      "view.insights.badge": "Aperçu",
      "view.support.title": "Bureau succès",
      "view.support.desc":
        "Guides, modèles et mini-SOP pour garder l'interface claire et cohérente.",
      "view.support.badge": "Prêt",
      "view.settings.title": "Paramètres",
      "view.settings.desc":
        "Préférences de l'espace et paramètres de langue par défaut.",
      "view.settings.note":
        "Les préférences sont enregistrées localement dans ce navigateur.",
      "view.invoices.kicker": "Finance",
      "invoices.open": "Ouvert :",
      "invoices.paid": "Payé :",
      "invoices.overdue": "En retard :",
      "invoices.empty": "Pas encore de factures.",
      "btn.newInvoice": "Nouvelle facture",
      "btn.newAutomation": "Nouvelle automatisation",
      "view.automations.empty":
        "Pas d'automatisations pour le moment. Créez votre premier flux avec des déclencheurs et des actions.",
      "view.smartTools.kicker": "Outils",
      "btn.exploreTools": "Explorer les outils",
      "view.insights.kicker": "Insights",
      "view.insights.empty":
        "Les insights apparaîtront ici : tendances de revenus, répartition des clients et alertes.",
      "view.settings.kicker": "Paramètres",
      "view.settings.configure":
        "Configurez votre espace, la facturation et les intégrations.",

      "insights.panels.title": "Tableaux d'analyse",
      "insights.panels.desc":
        "Cartes UBA prêtes pour vos métriques, annotations et exports.",
      "insights.panels.badge": "Local uniquement",
      "insights.panels.revenue.title": "Trajectoire de revenus",
      "insights.panels.revenue.desc":
        "Renouvellements à venir et totaux facturés visualisés pour lecture rapide.",
      "insights.panels.revenue.tag": "Repère €",
      "insights.panels.clients.title": "Dynamique clients",
      "insights.panels.clients.desc":
        "Suivez nouvelles signatures, risques de churn et vitesse des deals.",
      "insights.panels.clients.tag": "Repère CRM",
      "insights.panels.projects.title": "Flux projet",
      "insights.panels.projects.desc":
        "Cartographier lead → delivery → support pour voir les goulots d'étranglement.",
      "insights.panels.projects.tag": "Repère pipeline",
      "insights.panels.workload.title": "Équilibre de charge",
      "insights.panels.workload.desc":
        "Comparer la charge par responsable via un graphique fictif simple.",
      "insights.panels.workload.tag": "Repère ops",
      "insights.brief.title": "Note narrative",
      "insights.brief.desc":
        "Blocs simples pour aligner les parties prenantes.",
      "insights.brief.badge": "Placeholder",
      "insights.brief.items.readout.title": "Lecture de signaux",
      "insights.brief.items.readout.desc":
        "Utilisez ce bloc pour résumer ce qui a changé lors du dernier sprint.",
      "insights.brief.items.nextSteps.title": "Prochaines étapes",
      "insights.brief.items.nextSteps.desc":
        "Lister les expériences ou suivis avant de partager un export.",
      "insights.brief.items.risks.title": "Risques",
      "insights.brief.items.risks.desc":
        "Signalez les blocages, retards ou manques de données avant la présentation.",

      "settings.workspace.title": "Paramètres de l'espace",
      "settings.workspace.desc":
        "Enregistrer les préférences locales pour cet espace.",
      "settings.workspace.badge": "Local uniquement",
      "settings.workspace.name": "Nom de l'espace",
      "settings.workspace.placeholder": "Nommez votre espace",
      "settings.workspace.timezone": "Fuseau horaire",
      "settings.workspace.language": "Langue par défaut",
      "settings.workspace.save": "Enregistrer les préférences",
      "settings.workspace.status": "Non enregistré",
      "settings.workspace.saved": "Enregistré",
      "settings.profile.title": "Profil",
      "settings.profile.name": "Nom",
      "settings.profile.email": "E-mail",
      "settings.workspace.industry": "Secteur",
      "settings.workspace.description": "Description",
      "action.logout": "Se déconnecter",
      "settings.preferences.title": "Préférences",
      "settings.preferences.desc":
        "Activer l'affichage page unique et les notifications.",
      "settings.preferences.badge": "Instantané",
      "settings.preferences.singlePage": "Navigation une page",
      "settings.preferences.singlePageHint":
        "Afficher seulement la page choisie et masquer les autres vues.",
      "settings.preferences.notifications": "Notifications",
      "settings.preferences.notificationsHint":
        "Rappels rapides pour les événements de l'espace.",
      "settings.summary.title": "Résumé de l'espace",
      "settings.summary.desc":
        "Cartographie clé/valeur locale enregistrée dans votre navigateur.",
      "settings.summary.badge": "Local",
      "settings.summary.workspaceLabel": "Espace",
      "settings.summary.languageLabel": "Langue",
      "settings.summary.timezoneLabel": "Fuseau horaire",
      "settings.summary.singlePageLabel": "Vue une page",
      "settings.summary.notificationsLabel": "Notifications",
      "settings.summary.enabled": "Activé",
      "settings.summary.disabled": "Désactivé",

      "error.404.title": "Page introuvable",
      "error.404.desc":
        "Le lien suivi n'existe pas. Choisissez une section pour continuer.",
      "error.404.cta": "Retour à l'espace",
      "error.404.back": "Retour au tableau de bord",

      "demo.label": "Aperçu live",
      "demo.title": "Tableau prêt à remettre",
      "demo.desc":
        "Explorez un espace prérempli avec KPI, pipeline et mini-factures. Connectez vos clés Supabase plus tard pour synchroniser les données réelles.",
      "demo.ctaPrimary": "Connecter le compte",
      "demo.ctaSecondary": "Explorer le layout",

      "card.metrics.title": "Indicateurs clés",
      "card.metrics.desc":
        "Vue rapide des revenus, factures ouvertes et charge actuelle.",
      "card.metrics.range": "30 derniers jours",
      "kpi.billed.label": "Facturé (30j)",
      "kpi.billed.trend": "Basé sur les factures payées",
      "kpi.openInvoices.label": "Factures ouvertes",
      "kpi.openInvoices.trend": "Envoyées & en retard",
      "kpi.clients.label": "Clients actifs",
      "kpi.clients.trend": "Depuis Supabase CRM",
      "kpi.tasks.label": "Tâches du jour",
      "kpi.tasks.trend": "Liées aux projets",

      "card.tasks.title": "Tâches & suivis",
      "card.tasks.desc":
        "Ce qui mérite votre attention aujourd'hui à travers projets et clients.",
      "card.tasks.source": "Depuis Supabase",

      "card.pipeline.title": "Pipeline clients et projets",
      "card.pipeline.desc":
        "Des nouveaux leads aux constructions actives et à la maintenance.",

      "card.miniInvoices.title": "Mini-factures",
      "card.miniInvoices.desc":
        "Factures rapides et simples — intégration en attente.",
      "card.miniInvoices.badge": "Intégration requise",
      "mini.meta.count": "Factures visibles",
      "mini.meta.total": "Montant total",
      "mini.meta.local": "Local uniquement",
      "mini.badgeDemo": "Mode démo local",
      "mini.required": "Client et montant valide requis.",
      "mini.untitled": "Facture sans titre",
      "mini.saved":
        "Enregistré localement. Connectez Supabase pour synchroniser plus tard.",
      "mini.none": "Pas encore de facture. Ajoutez la première.",

      "card.automations.title": "Automations",
      "card.automations.desc":
        "Règles légères qui maintiennent l'admin en arrière-plan.",
      "card.automations.badge": "Aperçu",
      "auto.followUp": "Relancer les factures impayées",
      "auto.followUpDesc": "Envoyer un rappel 7 jours après échéance.",
      "auto.clientAlert": "Signaler les clients silencieux",
      "auto.clientAlertDesc":
        "Notifier lorsqu'il n'y a aucune activité pendant 14 jours.",
      "auto.taskBalance": "Équilibrer la charge",
      "auto.taskBalanceDesc":
        "Réassigner les tâches quand quelqu'un est surchargé.",

      "card.clients.title": "Clients",
      "card.clients.desc":
        "Gérez les contacts qui alimentent vos projets et factures.",
      "card.clients.badge": "CRM actif",

      "form.clientName": "Nom du client",
      "form.email": "E-mail",
      "form.company": "Entreprise",
      "form.phone": "Téléphone",
      "form.notes": "Notes",
      "form.amount": "Montant (€)",
      "form.shortDescription": "Brève description",
      "form.draft": "Brouillon",
      "form.sent": "Envoyée",
      "form.paid": "Payée",
      "form.addInvoice": "Ajouter une facture",
      "form.addClient": "Ajouter un client",

      "table.client": "Client",
      "table.label": "Libellé",
      "table.amount": "Montant",
      "table.status": "Statut",
      "table.name": "Nom",
      "table.company": "Entreprise",
      "table.email": "E-mail",
      "table.phone": "Téléphone",
      "table.actions": "Actions",

      "smart.hero.kicker": "Surface intelligente",
      "smart.hero.title": "Un panneau pour déléguer la routine",
      "smart.hero.desc":
        "Mélangez données CRM, historique de factures et tâches pour des suggestions ciblées de prospection, renouvellement et livraison.",
      "smart.hero.primary": "Lancer l'assistant",
      "smart.hero.secondary": "Voir la bibliothèque de prompts",
      "smart.cards.brief.title": "Fiche client",
      "smart.cards.brief.desc":
        "Créer automatiquement un résumé de 200 mots à partir du CRM, des tâches récentes et des factures impayées.",
      "smart.cards.outreach.title": "Relance intelligente",
      "smart.cards.outreach.desc":
        "Rédiger un message de suivi avec objets suggérés et appel à l'action.",
      "smart.cards.action.title": "Meilleure prochaine action",
      "smart.cards.action.desc":
        "Combiner pipeline, tâches et impact MRR pour proposer la priorité du jour.",

      "insights.hero.kicker": "Cockpit décision",
      "insights.hero.title": "Voir les signaux derrière vos KPI",
      "insights.hero.desc":
        "Suivre la dynamique de revenus, la vitesse des deals et la charge de travail avec des insights annotés.",
      "insights.hero.primary": "Exporter la vue",
      "insights.hero.secondary": "Programmer un e-mail",
      "insights.tiles.revenue.label": "Rythme de revenus",
      "insights.tiles.revenue.desc":
        "Projection trimestrielle avec hausse grâce aux clients récurrents.",
      "insights.tiles.revenue.chip1": "Complément requis : € 7,5k",
      "insights.tiles.revenue.chip2": "3 renouvellements ouverts",
      "insights.tiles.pipeline.label": "Santé du pipeline",
      "insights.tiles.pipeline.desc":
        "Couverture vs objectif sur les étapes lead → en cours.",
      "insights.tiles.pipeline.chip1": "2 deals bloqués 14j",
      "insights.tiles.pipeline.chip2": "Ajouter 1 discovery",
      "insights.tiles.team.label": "Charge d'équipe",
      "insights.tiles.team.desc":
        "Basé sur les tâches dues cette semaine et les SLA de rétention.",
      "insights.tiles.team.chip1": "2 tâches en retard",
      "insights.tiles.team.chip2": "Replanifier Atlas Labs",

      "support.hero.kicker": "Kit opérateur",
      "support.hero.title": "Pages de manuel prêtes pour l'équipe",
      "support.hero.desc":
        "Chaque SOP comprend une checklist, un responsable et les liens vers les tables concernées.",
      "support.hero.primary": "Télécharger le playbook",
      "support.hero.secondary": "Partager le guide workspace",
      "support.cards.invoice.title": "Hygiène des factures",
      "support.cards.invoice.desc":
        "Revue hebdomadaire des impayés, paiements récents et plafonds de contrat.",
      "support.cards.invoice.chip1": "Responsable : Finance",
      "support.cards.invoice.chip2": "10 min",
      "support.cards.crm.title": "Intake CRM",
      "support.cards.crm.desc":
        "Comment qualifier les leads, ajouter des notes de discovery et les injecter dans le pipeline.",
      "support.cards.crm.chip1": "Responsable : Ops",
      "support.cards.crm.chip2": "15 min",
      "support.cards.tasks.title": "Triage des tâches",
      "support.cards.tasks.desc":
        "Quand marquer un blocage, escalader ou transformer en demande facturable.",
      "support.cards.tasks.chip1": "Responsable : Delivery",
      "support.cards.tasks.chip2": "8 min",

      "auth.login.title": "Connexion",
      "auth.login.subtitle": "Accédez à votre espace MHM UBA.",
      "auth.login.button": "Se connecter",
      "auth.login.prompt": "Pas encore de compte ?",
      "auth.login.link": "Créer un compte",
      "auth.login.missing": "Merci de remplir e-mail et mot de passe.",
      "auth.login.failed": "Connexion échouée.",
      "auth.login.network": "Erreur réseau ou serveur. Réessayez.",

      "auth.signup.title": "Créez votre compte",
      "auth.signup.subtitle":
        "Un espace pour clients, tâches, factures et automatisations.",
      "auth.signup.button": "Créer le compte",
      "auth.signup.prompt": "Vous avez déjà un compte ?",
      "auth.signup.link": "Retour à la connexion",
      "auth.signup.missing": "Merci de remplir tous les champs.",
      "auth.signup.mismatch": "Les mots de passe ne correspondent pas.",
      "auth.signup.failed": "Création du compte échouée.",
      "auth.signup.confirmation":
        "Compte créé. Vérifiez votre e-mail pour confirmer.",
      "auth.signup.successRedirect": "Compte créé avec succès. Redirection...",

      "auth.email.label": "E-mail",
      "auth.email.placeholder": "you@example.com",
      "auth.password.label": "Mot de passe",
      "auth.password.placeholder": "Mot de passe",
      "auth.confirmPassword.label": "Confirmez le mot de passe",
      "auth.confirmPassword.placeholder": "Répétez le mot de passe",

      "errors.form": "Erreur de formulaire. Merci de recharger la page.",
      "errors.network": "Erreur réseau ou serveur. Réessayez.",
      "errors.logout": "Échec de la déconnexion. Réessayez.",

      "clients.demoMessage":
        "Connectez-vous pour synchroniser le CRM. La démo reste locale.",
      "clients.loading": "Chargement...",
      "clients.none": "Pas encore de clients. Ajoutez le premier.",
      "clients.deleteConfirm": "Supprimer ce client ?",
      "errors.loadClients": "Échec du chargement des clients.",
      "errors.deleteClient": "Échec de suppression du client.",
      "action.delete": "Supprimer",
      "smart.client.select": "Select client",
      "smart.client.selectPrompt": "Select a client to view a brief.",
      "smart.client.lastActivity": "Last activity",
      "smart.client.noActivity": "No recent activity",
      "smart.client.openInvoices": "Open invoices",
      "smart.client.activeProjects": "Active projects",
      "smart.client.recentTasks": "Recent tasks",
      "tool.outreach.hint": "Select a client to see outreach suggestions.",
      "tool.outreach.empty": "No suggestions at the moment.",
      "tool.actions.empty": "No immediate actions",
      "tool.insights.title": "Quick insights",
      "tool.insights.topClients": "Top clients",
      "tool.insights.overdueTasks": "Overdue tasks",
      "tool.insights.overdueLabel": "overdue",
      "tool.insights.topExpense": "Top expense",
    },
    es: {
      assistant_title: "UBA Assistant",
      assistant_subtitle: "Ask UBA Assistant for guidance and quick tips.",
      assistant_placeholder: "Ask a question…",
      "language.label": "Idioma",
      "language.en": "Inglés",
      "language.ar": "Árabe",
      "language.nl": "Neerlandés",
      "language.fr": "Francés",
      "language.es": "Español",
      "language.de": "Alemán",

      "app.tagline":
        "Automatizador empresarial universal: un solo espacio para clientes, tareas, facturas y herramientas inteligentes.",
      "app.badge": "Beta privada · Construido en los Países Bajos",
      "sidebar.footer":
        "Diseñado para equipos pequeños y fundadores solos cansados de usar siete herramientas para un solo negocio.",
      "top.kicker": "Espacio de trabajo",

      "nav.workspaceLabel": "Espacio de trabajo",
      "nav.dashboard": "Panel",
      "nav.dashboardSub": "Resumen",
      "nav.clients": "Clientes",
      "nav.clientsSub": "CRM",
      "nav.projects": "Proyectos",
      "nav.projectsSub": "Pipeline",
      "nav.tasks": "Tareas",
      "nav.tasksSub": "Hoy",
      "nav.invoices": "Facturas",
      "nav.invoicesSub": "Cobros",
      "nav.automations": "Automatizaciones",
      "nav.automationsSub": "Flujos",
      "nav.smartTools": "UBA Smart Tools",
      "nav.smartToolsSub": "Ops IA",
      "nav.insights": "Insights Lab",
      "nav.insightsSub": "Reportes",
      "nav.support": "Mesa de éxito",
      "nav.supportSub": "Guía",
      "nav.settings": "Configuración",
      "nav.settingsSub": "Espacio",

      "view.dashboard.title": "Resumen del negocio",
      "view.dashboard.desc":
        "Instantánea de hoy de tus clientes, facturas, tareas y automatizaciones.",
      "view.projects.title": "Proyectos",
      "view.projects.desc":
        "Vista de pipeline desde la tabla de proyectos de Supabase.",
      "view.projects.note":
        "Los proyectos ya se usan para KPI y pipeline. Más adelante construiremos CRUD completo.",
      "view.tasks.title": "Tareas",
      "view.tasks.desc": "Tablero de tareas detallado (próximamente).",
      "view.tasks.note":
        "Las tareas resumidas ya están en el panel desde Supabase.",
      "view.invoices.title": "Facturas",
      "view.invoices.desc": "Gestión completa de facturas con Supabase.",
      "view.invoices.note":
        "Los KPI ya se basan en tus facturas. Después habrá CRUD completo.",
      "view.automations.title": "Automatizaciones",
      "view.automations.desc":
        "Crea flujos que conecten clientes, facturas y tareas.",
      "view.automations.note":
        "Marcador de posición para lógica de automatización. Luego guardaremos flujos en JSON en Supabase.",
      "view.calendar.title": "Calendario",
      "view.calendar.desc": "Vista mensual de tareas, fechas límite y eventos.",
      "view.smartTools.title": "UBA Smart Tools",
      "view.smartTools.desc":
        "Ayudantes de IA que resumen contexto de clientes, redactan seguimientos y sugieren la siguiente acción.",
      "view.smartTools.badge": "Conceptos activos",
      "view.insights.title": "Insights Lab",
      "view.insights.desc":
        "Tableros narrativos para fundadores: tendencias, riesgos y victorias rápidas de un vistazo.",
      "view.insights.badge": "Vista previa",
      "view.support.title": "Mesa de éxito",
      "view.support.desc":
        "Guías, plantillas y micro-SOP para que todo sea claro y consistente.",
      "view.support.badge": "Listo",
      "view.settings.title": "Configuración",
      "view.settings.desc":
        "Preferencias del espacio y configuración de idioma predeterminada.",
      "view.settings.note":
        "Las preferencias se guardan localmente en este navegador.",
      "view.invoices.kicker": "Finanzas",
      "invoices.open": "Abierto:",
      "invoices.paid": "Pagado:",
      "invoices.overdue": "Vencido:",
      "invoices.empty": "Aún no hay facturas.",
      "btn.newInvoice": "Nueva factura",
      "btn.newAutomation": "Nueva automatización",
      "view.automations.empty":
        "No hay automatizaciones aún. Crea tu primer flujo usando disparadores y acciones.",
      "view.smartTools.kicker": "Herramientas",
      "btn.exploreTools": "Explorar herramientas",
      "view.insights.kicker": "Insights",
      "view.insights.empty":
        "Los insights aparecerán aquí: tendencias de ingresos, distribución de clientes y alertas.",
      "view.settings.kicker": "Configuración",
      "view.settings.configure":
        "Configura tu espacio, facturación e integraciones.",

      "insights.panels.title": "Paneles de analítica",
      "insights.panels.desc":
        "Tarjetas UBA listas para tus métricas, anotaciones y exportaciones.",
      "insights.panels.badge": "Solo local",
      "insights.panels.revenue.title": "Trayectoria de ingresos",
      "insights.panels.revenue.desc":
        "Renovaciones próximas y totales facturados visualizados para lectura rápida.",
      "insights.panels.revenue.tag": "Marcador €",
      "insights.panels.clients.title": "Impulso de clientes",
      "insights.panels.clients.desc":
        "Sigue nuevas ventas, riesgos de churn y velocidad de acuerdos.",
      "insights.panels.clients.tag": "Marcador CRM",
      "insights.panels.projects.title": "Flujo de proyectos",
      "insights.panels.projects.desc":
        "Mapea lead → entrega → soporte para ver cuellos de botella.",
      "insights.panels.projects.tag": "Marcador pipeline",
      "insights.panels.workload.title": "Balance de carga",
      "insights.panels.workload.desc":
        "Compara carga de tareas por responsable con un gráfico ficticio.",
      "insights.panels.workload.tag": "Marcador ops",
      "insights.brief.title": "Resumen narrativo",
      "insights.brief.desc":
        "Bloques simples para mantener alineados a los interesados.",
      "insights.brief.badge": "Placeholder",
      "insights.brief.items.readout.title": "Lectura de señales",
      "insights.brief.items.readout.desc":
        "Usa este bloque para resumir lo que cambió en el último sprint.",
      "insights.brief.items.nextSteps.title": "Próximos pasos",
      "insights.brief.items.nextSteps.desc":
        "Enumera experimentos o seguimientos antes de compartir un export.",
      "insights.brief.items.risks.title": "Riesgos",
      "insights.brief.items.risks.desc":
        "Menciona bloqueos, atrasos o vacíos de datos antes de presentar.",

      "settings.workspace.title": "Ajustes de espacio",
      "settings.workspace.desc":
        "Guarda las preferencias locales para este espacio.",
      "settings.workspace.badge": "Solo local",
      "settings.workspace.name": "Nombre del espacio",
      "settings.workspace.placeholder": "Nombra tu espacio",
      "settings.workspace.timezone": "Zona horaria",
      "settings.workspace.language": "Idioma predeterminado",
      "settings.workspace.save": "Guardar preferencias",
      "settings.workspace.status": "No guardado",
      "settings.workspace.saved": "Guardado",
      "settings.profile.title": "Perfil",
      "settings.profile.name": "Nombre",
      "settings.profile.email": "Correo electrónico",
      "settings.workspace.industry": "Industria",
      "settings.workspace.description": "Descripción",
      "action.logout": "Cerrar sesión",
      "settings.preferences.title": "Preferencias",
      "settings.preferences.desc":
        "Activa la vista de una sola página y las notificaciones.",
      "settings.preferences.badge": "Instantáneo",
      "settings.preferences.singlePage": "Navegación de una página",
      "settings.preferences.singlePageHint":
        "Muestra solo la página seleccionada y oculta las demás vistas.",
      "settings.preferences.notifications": "Notificaciones",
      "settings.preferences.notificationsHint":
        "Recordatorios rápidos para eventos del espacio.",
      "settings.summary.title": "Resumen del espacio",
      "settings.summary.desc":
        "Mapa local de claves/valores guardado en tu navegador.",
      "settings.summary.badge": "Local",
      "settings.summary.workspaceLabel": "Espacio",
      "settings.summary.languageLabel": "Idioma",
      "settings.summary.timezoneLabel": "Zona horaria",
      "settings.summary.singlePageLabel": "Vista de una página",
      "settings.summary.notificationsLabel": "Notificaciones",
      "settings.summary.enabled": "Activado",
      "settings.summary.disabled": "Desactivado",

      "error.404.title": "Página no encontrada",
      "error.404.desc":
        "El enlace que seguiste no existe. Elige una sección para continuar.",
      "error.404.cta": "Volver al espacio",
      "error.404.back": "Regresar al panel",

      "demo.label": "Vista en vivo",
      "demo.title": "Panel listo para entregar",
      "demo.desc":
        "Explora un espacio precargado con KPI, pipeline y mini-facturas. Conecta tus llaves de Supabase más tarde para sincronizar datos reales.",
      "demo.ctaPrimary": "Conectar cuenta",
      "demo.ctaSecondary": "Explorar diseño",

      "card.metrics.title": "Indicadores clave",
      "card.metrics.desc":
        "Vista rápida de ingresos, facturas abiertas y carga actual.",
      "card.metrics.range": "Últimos 30 días",
      "kpi.billed.label": "Facturado (30d)",
      "kpi.billed.trend": "Basado en facturas pagadas",
      "kpi.openInvoices.label": "Facturas abiertas",
      "kpi.openInvoices.trend": "Enviadas y vencidas",
      "kpi.clients.label": "Clientes activos",
      "kpi.clients.trend": "Desde Supabase CRM",
      "kpi.tasks.label": "Tareas de hoy",
      "kpi.tasks.trend": "Vinculadas a proyectos",

      "card.tasks.title": "Tareas y seguimientos",
      "card.tasks.desc":
        "Lo que necesita tu atención hoy en proyectos y clientes.",
      "card.tasks.source": "Desde Supabase",

      "card.pipeline.title": "Pipeline de clientes y proyectos",
      "card.pipeline.desc":
        "Desde nuevos leads hasta construcciones activas y mantenimiento.",

      "card.miniInvoices.title": "Mini-facturas",
      "card.miniInvoices.desc":
        "Facturas rápidas y simples — integración pendiente.",
      "card.miniInvoices.badge": "Se requiere integración",
      "mini.meta.count": "Facturas en vista",
      "mini.meta.total": "Monto total",
      "mini.meta.local": "Solo local",
      "mini.badgeDemo": "Modo demo local",
      "mini.required": "Se requiere cliente y monto válido.",
      "mini.untitled": "Factura sin título",
      "mini.saved":
        "Guardado localmente. Conecta Supabase para sincronizar luego.",
      "mini.none": "Aún no hay facturas. Agrega la primera.",

      "card.automations.title": "Automatizaciones",
      "card.automations.desc":
        "Reglas ligeras que mantienen la administración en segundo plano.",
      "card.automations.badge": "Vista previa",
      "auto.followUp": "Seguimiento de facturas impagas",
      "auto.followUpDesc":
        "Enviar recordatorio 7 días después del vencimiento.",
      "auto.clientAlert": "Alertar clientes inactivos",
      "auto.clientAlertDesc": "Notificar cuando no hay actividad por 14 días.",
      "auto.taskBalance": "Balancear carga de trabajo",
      "auto.taskBalanceDesc":
        "Reasignar tareas cuando alguien está sobrecargado.",

      "card.clients.title": "Clientes",
      "card.clients.desc":
        "Gestiona los contactos que impulsan tus proyectos y facturas.",
      "card.clients.badge": "CRM activo",

      "form.clientName": "Nombre del cliente",
      "form.email": "Correo electrónico",
      "form.company": "Empresa",
      "form.phone": "Teléfono",
      "form.notes": "Notas",
      "form.amount": "Monto (€)",
      "form.shortDescription": "Descripción corta",
      "form.draft": "Borrador",
      "form.sent": "Enviada",
      "form.paid": "Pagada",
      "form.addInvoice": "Agregar factura",
      "form.addClient": "Agregar cliente",

      "table.client": "Cliente",
      "table.label": "Concepto",
      "table.amount": "Monto",
      "table.status": "Estado",
      "table.name": "Nombre",
      "table.company": "Empresa",
      "table.email": "Correo",
      "table.phone": "Teléfono",
      "table.actions": "Acciones",

      "smart.hero.kicker": "Capa inteligente",
      "smart.hero.title": "Un panel para delegar el trabajo pesado",
      "smart.hero.desc":
        "Combina datos CRM, historial de facturas y tareas para obtener sugerencias específicas de prospección, renovaciones y entrega.",
      "smart.hero.primary": "Lanzar asistente",
      "smart.hero.secondary": "Ver biblioteca de prompts",
      "smart.cards.brief.title": "Resumen del cliente",
      "smart.cards.brief.desc":
        "Crear automáticamente un resumen de 200 palabras con CRM, tareas recientes y facturas impagas.",
      "smart.cards.outreach.title": "Alcance inteligente",
      "smart.cards.outreach.desc":
        "Redacta un mensaje de seguimiento con asuntos sugeridos y un llamado a la acción.",
      "smart.cards.action.title": "Siguiente mejor acción",
      "smart.cards.action.desc":
        "Combina pipeline, tareas e impacto MRR para sugerir qué hacer primero hoy.",

      "insights.hero.kicker": "Cabina de decisiones",
      "insights.hero.title": "Ver las señales detrás de tus KPI",
      "insights.hero.desc":
        "Sigue el ritmo de ingresos, velocidad de acuerdos y carga de trabajo con insights anotados.",
      "insights.hero.primary": "Exportar snapshot",
      "insights.hero.secondary": "Programar correo",
      "insights.tiles.revenue.label": "Ritmo de ingresos",
      "insights.tiles.revenue.desc":
        "Proyección del trimestre con impulso de clientes retenidos.",
      "insights.tiles.revenue.chip1": "Falta cubrir: € 7.5k",
      "insights.tiles.revenue.chip2": "3 renovaciones abiertas",
      "insights.tiles.pipeline.label": "Salud del pipeline",
      "insights.tiles.pipeline.desc":
        "Cobertura vs. objetivo a lo largo de lead → en curso.",
      "insights.tiles.pipeline.chip1": "2 acuerdos detenidos 14d",
      "insights.tiles.pipeline.chip2": "Agrega 1 discovery",
      "insights.tiles.team.label": "Carga del equipo",
      "insights.tiles.team.desc":
        "Basado en tareas de esta semana y SLAs de retención.",
      "insights.tiles.team.chip1": "2 tareas atrasadas",
      "insights.tiles.team.chip2": "Mover Atlas Labs",

      "support.hero.kicker": "Kit operativo",
      "support.hero.title": "Páginas de manual listas para el equipo",
      "support.hero.desc":
        "Cada SOP incluye checklist, responsable y enlaces a las tablas relevantes.",
      "support.hero.primary": "Descargar playbook",
      "support.hero.secondary": "Compartir guía del espacio",
      "support.cards.invoice.title": "Higiene de facturas",
      "support.cards.invoice.desc":
        "Revisión semanal de atrasos, pagos recientes y límites de retainer.",
      "support.cards.invoice.chip1": "Responsable: Finanzas",
      "support.cards.invoice.chip2": "10 min",
      "support.cards.crm.title": "Intake de CRM",
      "support.cards.crm.desc":
        "Cómo calificar leads, añadir notas de discovery y pasarlos al pipeline.",
      "support.cards.crm.chip1": "Responsable: Operaciones",
      "support.cards.crm.chip2": "15 min",
      "support.cards.tasks.title": "Triage de tareas",
      "support.cards.tasks.desc":
        "Cuándo marcar bloqueos, escalar o convertir en cambio facturable.",
      "support.cards.tasks.chip1": "Responsable: Delivery",
      "support.cards.tasks.chip2": "8 min",

      "auth.login.title": "Iniciar sesión",
      "auth.login.subtitle": "Accede a tu espacio MHM UBA.",
      "auth.login.button": "Entrar",
      "auth.login.prompt": "¿No tienes cuenta?",
      "auth.login.link": "Crear una",
      "auth.login.missing": "Completa correo y contraseña.",
      "auth.login.failed": "Inicio de sesión fallido.",
      "auth.login.network": "Error de red o servidor. Inténtalo de nuevo.",

      "auth.signup.title": "Crea tu cuenta",
      "auth.signup.subtitle":
        "Un solo espacio para clientes, tareas, facturas y automatización.",
      "auth.signup.button": "Crear cuenta",
      "auth.signup.prompt": "¿Ya tienes cuenta?",
      "auth.signup.link": "Volver a iniciar sesión",
      "auth.signup.missing": "Completa todos los campos.",
      "auth.signup.mismatch": "Las contraseñas no coinciden.",
      "auth.signup.failed": "Registro fallido.",
      "auth.signup.confirmation":
        "Cuenta creada. Revisa tu correo para confirmar.",
      "auth.signup.successRedirect": "Cuenta creada con éxito. Redirigiendo...",

      "auth.email.label": "Correo electrónico",
      "auth.email.placeholder": "you@example.com",
      "auth.password.label": "Contraseña",
      "auth.password.placeholder": "Contraseña",
      "auth.confirmPassword.label": "Confirmar contraseña",
      "auth.confirmPassword.placeholder": "Repetir contraseña",

      "errors.form": "Error en el formulario. Recarga la página.",
      "errors.network": "Error de red o servidor. Inténtalo de nuevo.",
      "errors.logout": "Cerrar sesión falló. Inténtalo de nuevo.",

      "clients.demoMessage":
        "Inicia sesión para sincronizar el CRM. La demo se mantiene local.",
      "clients.loading": "Cargando...",
      "clients.none": "Aún no hay clientes. Agrega el primero.",
      "clients.deleteConfirm": "¿Eliminar este cliente?",
      "errors.loadClients": "Error al cargar clientes.",
      "errors.deleteClient": "Error al eliminar cliente.",
      "action.delete": "Eliminar",
      "smart.client.select": "Select client",
      "smart.client.selectPrompt": "Select a client to view a brief.",
      "smart.client.lastActivity": "Last activity",
      "smart.client.noActivity": "No recent activity",
      "smart.client.openInvoices": "Open invoices",
      "smart.client.activeProjects": "Active projects",
      "smart.client.recentTasks": "Recent tasks",
      "tool.outreach.hint": "Select a client to see outreach suggestions.",
      "tool.outreach.empty": "No suggestions at the moment.",
      "tool.actions.empty": "No immediate actions",
      "tool.insights.title": "Quick insights",
      "tool.insights.topClients": "Top clients",
      "tool.insights.overdueTasks": "Overdue tasks",
      "tool.insights.overdueLabel": "overdue",
      "tool.insights.topExpense": "Top expense",
    },
    de: {
      assistant_title: "UBA Assistant",
      assistant_subtitle: "Ask UBA Assistant for guidance and quick tips.",
      assistant_placeholder: "Ask a question…",
      "language.label": "Sprache",
      "language.en": "Englisch",
      "language.ar": "Arabisch",
      "language.nl": "Niederländisch",
      "language.fr": "Französisch",
      "language.es": "Spanisch",
      "language.de": "Deutsch",

      "app.tagline":
        "Universeller Business-Automat – ein Arbeitsbereich für Kunden, Aufgaben, Rechnungen und smarte Tools.",
      "app.badge": "Private Beta · Entwickelt in den Niederlanden",
      "sidebar.footer":
        "Für kleine Teams und Solo-Gründer, die genug von sieben verschiedenen Tools für ein Unternehmen haben.",
      "top.kicker": "Arbeitsbereich",

      "nav.workspaceLabel": "Arbeitsbereich",
      "nav.dashboard": "Dashboard",
      "nav.dashboardSub": "Überblick",
      "nav.clients": "Kunden",
      "nav.clientsSub": "CRM",
      "nav.projects": "Projekte",
      "nav.projectsSub": "Pipeline",
      "nav.tasks": "Aufgaben",
      "nav.tasksSub": "Heute",
      "nav.invoices": "Rechnungen",
      "nav.invoicesSub": "Abrechnung",
      "nav.automations": "Automationen",
      "nav.automationsSub": "Flows",
      "nav.smartTools": "UBA Smart Tools",
      "nav.smartToolsSub": "AI Ops",
      "nav.insights": "Insights Lab",
      "nav.insightsSub": "Berichte",
      "nav.support": "Success Desk",
      "nav.supportSub": "Leitfäden",
      "nav.settings": "Einstellungen",
      "nav.settingsSub": "Arbeitsplatz",

      "view.dashboard.title": "Geschäftsüberblick",
      "view.dashboard.desc":
        "Heutiger Schnappschuss über Kunden, Rechnungen, Aufgaben und Automationen.",
      "view.clients.title": "Kunden",
      "view.clients.desc":
        "Lokales CRM-Board mit schnellem Hinzufügen, Bearbeiten und Löschen.",
      "view.clients.badge": "Lokales CRM",
      "view.clients.summary": "Kunden-Snapshot",
      "view.clients.summaryDesc":
        "Schneller Gesundheitscheck deiner lokalen CRM-Liste.",
      "view.clients.local": "Nur lokal",
      "view.clients.total": "Anzahl Kunden",
      "view.clients.tip": "Füge einen Kunden hinzu, um zu starten.",
      "view.clients.tipDone": "Kunden lokal gespeichert",
      "view.clients.recent": "Letzte Notiz",
      "view.clients.recentTip": "Aus dem zuletzt gespeicherten Kontakt.",
      "view.clients.hintTitle": "Daten sauber halten",
      "view.clients.hintDesc":
        "Nutze das Notizfeld für Verlängerungen, Ziele oder aktive Projekte.",
      "view.clients.localTitle": "Local-first",
      "view.clients.localDesc":
        "Daten liegen im Browser. Export oder Sync später möglich.",
      "view.projects.title": "Projekte",
      "view.projects.desc":
        "Pipeline-Ansicht aktiver Arbeit, lokal gespeichert.",
      "view.projects.badge": "Pipeline",
      "view.projects.kicker": "Pipeline-Fluss",
      "view.projects.titleInline": "Projekte nach Phase voranbringen",
      "view.projects.subtitle": "Drag-ähnliches Layout mit Karten pro Phase.",
      "view.tasks.title": "Aufgaben",
      "view.tasks.desc":
        "Kanban-Board mit lokalen Aufgaben und Schnellaktionen.",
      "view.tasks.badge": "Lokales Board",
      "view.tasks.owner": "Verantwortlich",
      "view.tasks.moveBack": "Zurück",
      "view.tasks.moveForward": "Weiter",
      "view.invoices.title": "Rechnungen",
      "view.invoices.desc": "Volles CRUD mit Local Storage im Dashboard-Stil.",
      "view.invoices.badge": "Lokale Abrechnung",
      "view.invoices.local": "Nur lokal",
      "view.invoices.due": "Fällig",
      "view.automations.title": "Automationen",
      "view.automations.desc": "Übersicht der Flows mit Beispiel-Aktivitäten.",
      "view.automations.badge": "Vorschau",
      "view.automations.logTitle": "Aktuelle Läufe",
      "view.automations.logDesc": "Leichter Verlauf der Automations-Aktivität",
      "view.calendar.title": "Kalender",
      "view.calendar.desc": "Monatsübersicht von Aufgaben, Fristen und Ereignissen.",
      "view.automations.logHint": "Derzeit statische Beispieldaten.",
      "view.automations.logAutomation": "Automation",
      "view.automations.logStatus": "Status",
      "view.automations.logTime": "Zeit",
      "view.smartTools.title": "UBA Smart Tools",
      "view.smartTools.desc":
        "Karten für verfügbare Assistenten im bekannten Layout.",
      "view.smartTools.badge": "Live-Konzepte",
      "view.insights.title": "Insights Lab",
      "view.insights.desc":
        "Narrative Dashboards für Gründer: Trends, Risiken und Quick Wins auf einen Blick.",
      "view.insights.badge": "Vorschau",
      "view.support.title": "Success Desk",
      "view.support.desc":
        "Leitfäden, Vorlagen und Mini-SOPs für Klarheit und Konsistenz.",
      "view.support.badge": "Bereit",
      "view.settings.title": "Einstellungen",
      "view.settings.desc": "Arbeitsbereichs- und Sprachstandards.",
      "view.settings.note":
        "Einstellungen werden lokal in diesem Browser gespeichert.",

      "insights.panels.title": "Analyse-Panels",
      "insights.panels.desc":
        "UBA-Karten bereit für Kennzahlen, Anmerkungen und Exporte.",
      "insights.panels.badge": "Nur lokal",
      "insights.panels.revenue.title": "Umsatz-Runway",
      "insights.panels.revenue.desc":
        "Bevorstehende Verlängerungen und Faktura-Summen als schnelle Ansicht.",
      "insights.panels.revenue.tag": "€ Platzhalter",
      "insights.panels.clients.title": "Kunden-Momentum",
      "insights.panels.clients.desc":
        "Verfolge neue Abschlüsse, Churn-Risiken und Deal-Tempo.",
      "insights.panels.clients.tag": "CRM-Platzhalter",
      "insights.panels.projects.title": "Projektfluss",
      "insights.panels.projects.desc":
        "Lead → Delivery → Support abbilden, um Engpässe zu sehen.",
      "insights.panels.projects.tag": "Pipeline-Platzhalter",
      "insights.panels.workload.title": "Arbeitslast-Balance",
      "insights.panels.workload.desc":
        "Vergleiche Aufgabenlast je Besitzer mit einfachem Platzhalter-Chart.",
      "insights.panels.workload.tag": "Ops-Platzhalter",
      "insights.brief.title": "Narrative Notiz",
      "insights.brief.desc":
        "Einfache Story-Blöcke, um Stakeholder zu alignen.",
      "insights.brief.badge": "Platzhalter",
      "insights.brief.items.readout.title": "Signal-Überblick",
      "insights.brief.items.readout.desc":
        "Nutze diesen Block, um Änderungen des letzten Sprints zu bündeln.",
      "insights.brief.items.nextSteps.title": "Nächste Schritte",
      "insights.brief.items.nextSteps.desc":
        "Liste Experimente oder Follow-ups auf, bevor du einen Export teilst.",
      "insights.brief.items.risks.title": "Risiken",
      "insights.brief.items.risks.desc":
        "Weise auf Blocker, Überfälliges oder Datenlücken hin, bevor du präsentierst.",

      "settings.workspace.title": "Arbeitsbereich-Einstellungen",
      "settings.workspace.desc":
        "Lokale Präferenzen für diesen Bereich speichern.",
      "settings.workspace.badge": "Nur lokal",
      "settings.workspace.name": "Arbeitsbereichsname",
      "settings.workspace.placeholder": "Benenne deinen Bereich",
      "settings.workspace.timezone": "Zeitzone",
      "settings.workspace.language": "Standardsprache",
      "settings.workspace.save": "Einstellungen speichern",
      "settings.workspace.status": "Nicht gespeichert",
      "settings.workspace.saved": "Gespeichert",
      "settings.profile.title": "Profil",
      "settings.profile.name": "Name",
      "settings.profile.email": "E-Mail",
      "settings.workspace.industry": "Branche",
      "settings.workspace.description": "Beschreibung",
      "action.logout": "Abmelden",
      "settings.preferences.title": "Präferenzen",
      "settings.preferences.desc":
        "Single-Page-Ansicht und Benachrichtigungen umschalten.",
      "settings.preferences.badge": "Sofort",
      "settings.preferences.singlePage": "Ein-Seiten-Navigation",
      "settings.preferences.singlePageHint":
        "Nur die gewählte Seite zeigen und andere Ansichten ausblenden.",
      "settings.preferences.notifications": "Benachrichtigungen",
      "settings.preferences.notificationsHint":
        "Kurze Hinweise für Workspace-Ereignisse.",
      "settings.summary.title": "Arbeitsbereich-Übersicht",
      "settings.summary.desc":
        "Lokale Key/Value-Mapping im Browser gespeichert.",
      "settings.summary.badge": "Lokal",
      "settings.summary.workspaceLabel": "Arbeitsbereich",
      "settings.summary.languageLabel": "Sprache",
      "settings.summary.timezoneLabel": "Zeitzone",
      "settings.summary.singlePageLabel": "Ein-Seiten-Ansicht",
      "settings.summary.notificationsLabel": "Benachrichtigungen",
      "settings.summary.enabled": "Aktiv",
      "settings.summary.disabled": "Deaktiviert",

      "error.404.title": "Seite nicht gefunden",
      "error.404.desc":
        "Der aufgerufene Link existiert nicht. Wähle einen Bereich zum Fortfahren.",
      "error.404.cta": "Zurück zur Arbeitsfläche",
      "error.404.back": "Zurück zum Dashboard",

      "demo.label": "Live-Vorschau",
      "demo.title": "Board bereit zur Übergabe",
      "demo.desc":
        "Erkunde einen vorgefüllten Arbeitsbereich mit KPIs, Pipeline und Mini-Rechnungen. Verbinde später deine Supabase-Schlüssel, um echte Daten zu synchronisieren.",
      "demo.ctaPrimary": "Account verbinden",
      "demo.ctaSecondary": "Layout erkunden",

      "card.metrics.title": "Kernkennzahlen",
      "card.metrics.desc":
        "Schneller Blick auf Umsatz, offene Rechnungen und aktuelle Auslastung.",
      "card.metrics.range": "Letzte 30 Tage",
      "kpi.billed.label": "Abgerechnet (30T)",
      "kpi.billed.trend": "Basierend auf bezahlten Rechnungen",
      "kpi.openInvoices.label": "Offene Rechnungen",
      "kpi.openInvoices.trend": "Gesendet & überfällig",
      "kpi.clients.label": "Aktive Kunden",
      "kpi.clients.trend": "Aus Supabase CRM",
      "kpi.tasks.label": "Aufgaben heute",
      "kpi.tasks.trend": "Mit Projekten verknüpft",

      "card.tasks.title": "Aufgaben & Follow-ups",
      "card.tasks.desc":
        "Was heute über Projekte und Kunden deine Aufmerksamkeit braucht.",
      "card.tasks.source": "Aus Supabase",

      "card.pipeline.title": "Kunden- und Projektpipeline",
      "card.pipeline.desc": "Von neuen Leads bis aktive Builds und Wartung.",

      "card.miniInvoices.title": "Mini-Rechnungen",
      "card.miniInvoices.desc":
        "Einfache Schnellrechnungen – Integration ausstehend.",
      "card.miniInvoices.badge": "Integration erforderlich",
      "mini.meta.count": "Rechnungen in Ansicht",
      "mini.meta.total": "Gesamtbetrag",
      "mini.meta.local": "Nur lokal",
      "mini.badgeDemo": "Lokaler Demomodus",
      "mini.required": "Kunde und gültiger Betrag erforderlich.",
      "mini.untitled": "Rechnung ohne Titel",
      "mini.saved":
        "Lokal gespeichert. Verbinde Supabase für spätere Synchronisierung.",
      "mini.none": "Noch keine Rechnungen. Füge die erste hinzu.",

      "card.automations.title": "Automationen",
      "card.automations.desc":
        "Leichte Regeln, die deine Admin im Hintergrund bewegen.",
      "card.automations.badge": "Vorschau",
      "auto.followUp": "Unbezahlte Rechnungen nachfassen",
      "auto.followUpDesc": "Erinnerung 7 Tage nach Fälligkeit senden.",
      "auto.clientAlert": "Stille Kunden melden",
      "auto.clientAlertDesc":
        "Benachrichtigen, wenn 14 Tage keine Aktivität war.",
      "auto.taskBalance": "Arbeitslast balancieren",
      "auto.taskBalanceDesc":
        "Aufgaben neu zuweisen, wenn jemand überlastet ist.",

      "card.clients.title": "Kunden",
      "card.clients.desc":
        "Verwalte die Kontakte, die deine Projekte und Rechnungen tragen.",
      "card.clients.badge": "Live-CRM",

      "form.clientName": "Kundenname",
      "form.email": "E-Mail",
      "form.company": "Unternehmen",
      "form.phone": "Telefon",
      "form.notes": "Notizen",
      "form.amount": "Betrag (€)",
      "form.shortDescription": "Kurze Beschreibung",
      "form.draft": "Entwurf",
      "form.sent": "Gesendet",
      "form.paid": "Bezahlt",
      "form.addInvoice": "Rechnung hinzufügen",
      "form.addClient": "Kunden hinzufügen",
      "form.saveClient": "Kunde speichern",
      "form.updateClient": "Kunde aktualisieren",
      "form.saveInvoice": "Rechnung speichern",
      "form.updateInvoice": "Rechnung aktualisieren",

      "table.client": "Kunde",
      "table.label": "Bezeichnung",
      "table.amount": "Betrag",
      "table.status": "Status",
      "table.name": "Name",
      "table.company": "Unternehmen",
      "table.email": "E-Mail",
      "table.phone": "Telefon",
      "table.actions": "Aktionen",

      "smart.hero.kicker": "Intelligente Ebene",
      "smart.hero.title": "Ein Panel, um die Fleißarbeit abzugeben",
      "smart.hero.desc":
        "Kombiniere CRM-Daten, Rechnungshistorie und Aufgaben für gezielte Vorschläge zu Akquise, Verlängerungen und Lieferung.",
      "smart.hero.primary": "Assistent starten",
      "smart.hero.secondary": "Prompt-Bibliothek ansehen",
      "smart.cards.brief.title": "Kundenbrief",
      "smart.cards.brief.desc":
        "Automatisch eine Zusammenfassung aus CRM-Feldern, aktuellen Aufgaben und offenen Rechnungen erstellen.",
      "smart.cards.outreach.title": "Smarter Outreach",
      "smart.cards.outreach.desc":
        "Follow-up-Nachricht mit vorgeschlagenen Betreffs und Call-to-Action entwerfen.",
      "smart.cards.action.title": "Beste nächste Aktion",
      "smart.cards.action.desc":
        "Pipeline, Aufgaben und Umsatzimpact kombinieren, um die heutige Priorität zu empfehlen.",

      "insights.hero.kicker": "Entscheidungs-Cockpit",
      "insights.hero.title": "Die Signale hinter deinen KPIs sehen",
      "insights.hero.desc":
        "Umsatzdynamik, Deal-Geschwindigkeit und Auslastung mit kommentierten Insights verfolgen.",
      "insights.hero.primary": "Snapshot exportieren",
      "insights.hero.secondary": "E-Mail planen",
      "insights.tiles.revenue.label": "Umsatztakt",
      "insights.tiles.revenue.desc":
        "Für dieses Quartal prognostiziert mit Auftrieb durch Bestandskunden.",
      "insights.tiles.revenue.chip1": "Lücke schließen: € 7,5k",
      "insights.tiles.revenue.chip2": "3 offene Verlängerungen",
      "insights.tiles.pipeline.label": "Pipeline-Gesundheit",
      "insights.tiles.pipeline.desc": "Abdeckung vs. Ziel über Lead → laufend.",
      "insights.tiles.pipeline.chip1": "2 Deals 14 Tage fest",
      "insights.tiles.pipeline.chip2": "1 Discovery hinzufügen",
      "insights.tiles.team.label": "Teamauslastung",
      "insights.tiles.team.desc":
        "Basierend auf fälligen Aufgaben dieser Woche und SLA-Verpflichtungen.",
      "insights.tiles.team.chip1": "2 Aufgaben überfällig",
      "insights.tiles.team.chip2": "Atlas Labs verschieben",

      "support.hero.kicker": "Operator-Set",
      "support.hero.title": "Handbuchseiten für das Team",
      "support.hero.desc":
        "Jede SOP enthält Checkliste, Verantwortlichen und Links zu den relevanten Tabellen.",
      "support.hero.primary": "Playbook herunterladen",
      "support.hero.secondary": "Workspace-Leitfaden teilen",
      "support.cards.invoice.title": "Rechnungs-Hygiene",
      "support.cards.invoice.desc":
        "Wöchentliche Prüfung von Rückständen, Zahlungen und Retainer-Limits.",
      "support.cards.invoice.chip1": "Owner: Finanzen",
      "support.cards.invoice.chip2": "10 Min",
      "support.cards.crm.title": "CRM-Intake",
      "support.cards.crm.desc":
        "Wie man neue Leads qualifiziert, Notizen hinzufügt und in die Pipeline bringt.",
      "support.cards.crm.chip1": "Owner: Ops",
      "support.cards.crm.chip2": "15 Min",
      "support.cards.tasks.title": "Aufgaben-Triage",
      "support.cards.tasks.desc":
        "Wann Blocker markieren, eskalieren oder in eine abrechenbare Änderung umwandeln.",
      "support.cards.tasks.chip1": "Owner: Delivery",
      "support.cards.tasks.chip2": "8 Min",

      "auth.login.title": "Anmelden",
      "auth.login.subtitle": "Greife auf deinen MHM UBA-Arbeitsbereich zu.",
      "auth.login.button": "Anmelden",
      "auth.login.prompt": "Noch kein Konto?",
      "auth.login.link": "Eines erstellen",
      "auth.login.missing": "Bitte E-Mail und Passwort ausfüllen.",
      "auth.login.failed": "Anmeldung fehlgeschlagen.",
      "auth.login.network": "Netzwerk- oder Serverfehler. Versuche es erneut.",

      "auth.signup.title": "Konto erstellen",
      "auth.signup.subtitle":
        "Ein Arbeitsbereich für Kunden, Aufgaben, Rechnungen und Automatisierung.",
      "auth.signup.button": "Konto anlegen",
      "auth.signup.prompt": "Schon ein Konto?",
      "auth.signup.link": "Zurück zum Login",
      "auth.signup.missing": "Bitte alle Felder ausfüllen.",
      "auth.signup.mismatch": "Passwörter stimmen nicht überein.",
      "auth.signup.failed": "Registrierung fehlgeschlagen.",
      "auth.signup.confirmation":
        "Konto erstellt. Bitte E-Mail zur Bestätigung prüfen.",
      "auth.signup.successRedirect":
        "Konto erfolgreich erstellt. Weiterleitung...",

      "auth.email.label": "E-Mail",
      "auth.email.placeholder": "you@example.com",
      "auth.password.label": "Passwort",
      "auth.password.placeholder": "Passwort",
      "auth.confirmPassword.label": "Passwort bestätigen",
      "auth.confirmPassword.placeholder": "Passwort wiederholen",

      "errors.form": "Formularfehler. Bitte Seite neu laden.",
      "errors.network": "Netzwerk- oder Serverfehler. Versuche es erneut.",
      "errors.logout": "Abmelden fehlgeschlagen. Versuche es erneut.",

      "clients.demoMessage":
        "Melde dich an, um CRM-Daten zu synchronisieren. Die Demo bleibt lokal.",
      "clients.loading": "Lädt...",
      "clients.none": "Noch keine Kunden. Füge den ersten hinzu.",
      "clients.deleteConfirm": "Diesen Kunden löschen?",
      "errors.loadClients": "Kunden konnten nicht geladen werden.",
      "errors.deleteClient": "Kunde konnte nicht gelöscht werden.",
      "action.delete": "Löschen",
      "smart.client.select": "Select client",
      "smart.client.selectPrompt": "Select a client to view a brief.",
      "smart.client.lastActivity": "Last activity",
      "smart.client.noActivity": "No recent activity",
      "smart.client.openInvoices": "Open invoices",
      "smart.client.activeProjects": "Active projects",
      "smart.client.recentTasks": "Recent tasks",
      "tool.outreach.hint": "Select a client to see outreach suggestions.",
      "tool.outreach.empty": "No suggestions at the moment.",
      "tool.actions.empty": "No immediate actions",
      "tool.insights.title": "Quick insights",
      "tool.insights.topClients": "Top clients",
      "tool.insights.overdueTasks": "Overdue tasks",
      "tool.insights.overdueLabel": "overdue",
      "tool.insights.topExpense": "Top expense",
      "action.edit": "Bearbeiten",
    },
  };

  const viewMeta = {
    dashboard: {
      titleKey: "view.dashboard.title",
      descKey: "view.dashboard.desc",
    },
    clients: { titleKey: "view.clients.title", descKey: "view.clients.desc" },
    projects: {
      titleKey: "view.projects.title",
      descKey: "view.projects.desc",
    },
    tasks: { titleKey: "view.tasks.title", descKey: "view.tasks.desc" },
    invoices: {
      titleKey: "view.invoices.title",
      descKey: "view.invoices.desc",
    },
    automations: {
      titleKey: "view.automations.title",
      descKey: "view.automations.desc",
    },
    calendar: {
      titleKey: "view.calendar.title",
      descKey: "view.calendar.desc",
    },
    "smart-tools": {
      titleKey: "view.smartTools.title",
      descKey: "view.smartTools.desc",
    },
    insights: {
      titleKey: "view.insights.title",
      descKey: "view.insights.desc",
    },
    support: { titleKey: "view.support.title", descKey: "view.support.desc" },
    settings: {
      titleKey: "view.settings.title",
      descKey: "view.settings.desc",
    },
  };

  let currentLanguage = localStorage.getItem("uba-lang") || "en";
  let currentView = "dashboard";

  const getDictionary = (lang = currentLanguage) =>
    translations[lang] || translations.en;

  const t = (key, fallback = "") => {
    const dict = getDictionary();
    if (dict && key in dict) return dict[key];
    if (translations.en && key in translations.en) return translations.en[key];
    return fallback || key;
  };

  const syncLanguageSelects = (lang) => {
    [
      "language-select",
      "language-select-top",
      "language-select-settings",
      "language-select-404",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = lang;
    });
  };

  const updateViewHeader = (viewKey) => {
    currentView = viewKey || currentView;
    const meta = viewMeta[currentView] || viewMeta.dashboard;
    const titleEl = document.getElementById("uba-view-title");
    const descEl = document.getElementById("uba-view-desc");
    if (titleEl && meta?.titleKey) titleEl.textContent = t(meta.titleKey);
    if (descEl && meta?.descKey) descEl.textContent = t(meta.descKey);
  };

  const applyTranslations = (lang = currentLanguage) => {
    currentLanguage = translations[lang] ? lang : "en";
    localStorage.setItem("uba-lang", currentLanguage);

    const isRTL = currentLanguage === "ar";
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    if (document.body) {
      document.body.classList.toggle("rtl", isRTL);
    }

    const dict = getDictionary(currentLanguage);
    const fallback = translations.en || {};

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = (dict && dict[key]) ?? fallback[key];
      if (value) el.textContent = value;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const value = (dict && dict[key]) ?? fallback[key];
      if (value && "placeholder" in el) {
        el.placeholder = value;
      }
    });

    syncLanguageSelects(currentLanguage);
    updateViewHeader(currentView);
  };

  window.ubaI18n = {
    translations,
    viewMeta,
    getDictionary,
    t,
    applyTranslations,
    syncLanguageSelects,
    updateViewHeader,
    get currentLanguage() {
      return currentLanguage;
    },
    set currentLanguage(value) {
      currentLanguage = value;
    },
    getCurrentView() {
      return currentView;
    },
    setCurrentView(view) {
      currentView = view;
      updateViewHeader(view);
    },
  };
})();
