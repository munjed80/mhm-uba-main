# MHM Universal Business Automator (UBA)

> ⚠️ **IMPORTANT: NOT PRODUCTION READY** - This is a demo/prototype application. See [Production Readiness](#-production-readiness) section below.

A comprehensive business management platform that provides an all-in-one workspace for clients, tasks, invoices, and smart automation tools.

![MHM UBA Dashboard](https://github.com/user-attachments/assets/b6ca306c-2bd0-48bb-95ac-dd91a66ccd81)

## 🚨 Production Readiness

**Current Status:** Demo/Prototype Only (25/100 production readiness score)

This application is **NOT suitable for production deployment** due to:
- ❌ No backend infrastructure (localStorage only)
- ❌ No real authentication (guest mode only)
- ❌ Critical security vulnerabilities (270+ XSS issues)
- ❌ Minimal testing coverage
- ❌ No deployment infrastructure

**Safe Uses:**
- ✅ Local development and testing
- ✅ UI/UX demonstrations
- ✅ Feature showcases
- ✅ Learning and experimentation

**For Production Use:**
See comprehensive guides:
- 📋 [Production Readiness Review](./PRODUCTION-READINESS-REVIEW.md) - Complete assessment
- 🔒 [Security Guide](./SECURITY-GUIDE.md) - Security hardening
- 🏗️ [Architecture Guide](./ARCHITECTURE-GUIDE.md) - Implementation roadmap
- 📖 [Quick Reference](./QUICK-REFERENCE.md) - Summary and next steps

**Estimated effort to production:** 5-7 months with 2-3 developers. See guides for details.

---

## ✨ Features

### Core Modules
- **📊 Dashboard** - Real-time business overview with KPIs and metrics
- **🧑‍💻 Clients** - CRM system with client relationship management
- **💼 Projects** - Project pipeline and stage tracking
- **✅ Tasks** - Task management with priorities and due dates
- **💵 Invoices** - Billing system with status tracking
- **🤖 Automations** - Workflow automation engine
- **📅 Calendar** - Event scheduling and management
- **🧲 Leads** - Lead scoring and pipeline management
- **📤 Expenses** - Expense tracking with categories and analytics
- **📁 Files** - Document management system
- **📑 Reports** - Business analytics and reporting

### Enhanced Features
- **AI Assistant** - Intelligent business assistant for guidance
- **Smart Tools** - AI-powered automation and insights
- **Multi-language Support** - English, Arabic, Dutch, French, Spanish, German
- **RTL Support** - Full right-to-left language support
- **Demo Mode** - Pre-populated workspace for testing
- **Local Storage** - Works offline with localStorage persistence
- **Responsive Design** - Mobile-friendly interface

## 🚀 Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A simple HTTP server (optional, but recommended to avoid CORS issues)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/munjed80/mhm-uba-main.git
   cd mhm-uba-main
   ```

2. **Serve the project**

   Using Python:
   ```bash
   python -m http.server 8000
   ```

   Using Node.js:
   ```bash
   npx http-server -p 8000
   ```

   Using PHP:
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**
   
   Navigate to `http://localhost:8000`

## 📖 Usage

### Demo Mode
The application comes with demo data pre-loaded. Simply open `index.html` to explore the features.

### Supabase Integration (Optional)
To connect your own data:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Update the Supabase credentials in `assets/js/app.js`:
   ```javascript
   const SUPABASE_URL = "your-project-url";
   const SUPABASE_ANON_KEY = "your-anon-key";
   ```
3. Set up the database schema for `invoices`, `clients`, `tasks`, and `projects` tables

### Language Support
Change the language using the dropdown in the sidebar. The app supports:
- English (en)
- Arabic (ar) with RTL layout
- Dutch (nl)
- French (fr)
- Spanish (es)
- German (de)

## 🎯 Project Structure

```
mhm-uba-main/
├── assets/
│   ├── css/          # Stylesheets
│   └── js/           # JavaScript modules
├── cypress/          # E2E tests
│   └── e2e/
├── index.html        # Main dashboard
├── clients.html      # Client management page
├── projects.html     # Project pipeline page
├── tasks.html        # Task management page
├── invoices.html     # Billing page
├── ...               # Other feature pages
└── README.md         # This file
```

## 🧪 Testing

### Manual Testing
1. Serve the project locally
2. Open `http://localhost:8000`
3. Navigate through all pages
4. Test CRUD operations on clients, projects, tasks, and invoices
5. Verify data persistence using browser localStorage

### Automated Testing (Cypress)
```bash
npx cypress open --config baseUrl=http://localhost:8000
```

Run the smoke test (`cypress/e2e/smoke.cy.js`) to verify basic functionality.

## 🔧 Development

### Key Technologies
- **Vanilla JavaScript** - No framework dependencies
- **LocalStorage API** - Client-side data persistence
- **Supabase** - Optional backend integration
- **Chart.js** - Data visualization
- **jsPDF** - PDF generation

### Code Organization
- **Modular Architecture** - Each feature in separate JS files
- **Component-based** - Reusable UI components
- **Data Layer** - Centralized data management via `ubaStore`
- **Event-driven** - Pub/sub pattern for component communication

### Adding New Features
1. Create HTML page in root directory
2. Add JavaScript module in `assets/js/`
3. Add CSS in `assets/css/` if needed
4. Register in `assets/js/page-loader.js`
5. Add navigation link in `index.html` sidebar

## 📝 Configuration

### Local Storage Keys
The app uses these localStorage keys:
- `uba-local-clients` - Client data
- `uba-local-projects` - Project data
- `uba-local-tasks` - Task data
- `uba-local-invoices` - Invoice data
- `uba-settings` - User settings
- `ubaLanguage` - Selected language

### Customization
- **Branding**: Edit logo and tagline in sidebar (`index.html`)
- **Colors**: Modify CSS variables in `assets/css/style.css`
- **Features**: Enable/disable features in `assets/js/feature-flags.js`

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ in the Netherlands
- Designed for small teams and solo founders
- Inspired by the need for simple, integrated business tools

## 📞 Support

- **Documentation**: Check the guides in the repository
- **Issues**: [GitHub Issues](https://github.com/munjed80/mhm-uba-main/issues)
- **Success Desk**: Available in the app at `help.html`

## 🗺️ Roadmap

**Note:** Before implementing new features, the application must first be made production-ready. See [Production Readiness](#-production-readiness) section above.

### Phase 1: Production Readiness (Priority)
- [ ] Implement backend infrastructure (Supabase or custom)
- [ ] Add real authentication and authorization
- [ ] Fix security vulnerabilities
- [ ] Add comprehensive testing
- [ ] Set up CI/CD and deployment

### Phase 2: Core Features (After Production Ready)
- [ ] Real-time collaboration
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced reporting and analytics
- [ ] Third-party integrations (Stripe, QuickBooks, etc.)
- [ ] Team collaboration features
- [ ] Advanced automation workflows

## 📚 Comprehensive Documentation

**Production Readiness Assessment (Nov 2025):**
- 📋 [Production Readiness Review](./PRODUCTION-READINESS-REVIEW.md) - Complete 360° assessment with roadmap
- 🔒 [Security Guide](./SECURITY-GUIDE.md) - Security vulnerabilities and hardening guide
- 🏗️ [Architecture Guide](./ARCHITECTURE-GUIDE.md) - Technical architecture and implementation
- 📖 [Quick Reference](./QUICK-REFERENCE.md) - Summary and immediate actions

**Development Guides:**
- 📖 [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute
- 🧪 [Testing Guide](./TESTING.md) - Manual and automated testing
- 🏢 [SaaS Architecture](./SAAS-ARCHITECTURE.md) - Multi-tenancy design
- ✅ [QA Checklist](./QA-Checklist.md) - Release checklist

---

**MHM UBA** - One workspace for all your business needs.

⚠️ **Remember:** This is currently a demo/prototype. See production readiness guides before deploying.
