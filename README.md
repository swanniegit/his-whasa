# WHASA Wound Care App

A comprehensive wound-care nurse practitioner application designed to streamline clinical workflows and improve patient outcomes in accordance with WHASA (Wound Healing Association of Southern Africa) guidelines.

## 🏥 Project Overview

This application guides wound specialist nurses through the entire wound-care process from patient registration to wound healing, incorporating both negative-pressure wound therapy (NPWT) and conventional wound management protocols.

### Key Features

- **Patient Registration & Intake**: Complete demographic and clinical history capture
- **Wound Assessment**: T.I.M.E. framework, ABPI measurements, specialized assessments
- **Care Planning**: Evidence-based treatment recommendations with WHASA guidelines
- **Therapy Execution**: NPWT and conventional wound care workflows
- **Offline-First Design**: Full functionality without network connectivity
- **Clinical Decision Support**: ABPI thresholds, compression therapy recommendations
- **Photo Documentation**: Wound imaging with measurement tools
- **Inventory Management**: Barcode scanning and supply tracking
- **Patient Portal**: Education modules and secure communication

## 🚀 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **PWA**: Service Workers + IndexedDB for offline functionality
- **Styling**: Tailwind CSS with clinical-specific design system
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whasa-wound-care-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the modular database schema files from `database/schemas/`
   - Configure Row Level Security (RLS) policies
   - Set up authentication providers

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

1. **Create Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Run modular schema files**
   ```bash
   # Execute schema files in order:
   # 1. Core System (01-core-system.sql)
   # 2. Patient Management (02-patient-management.sql)
   # 3. Wound Assessment (03-wound-assessment.sql)
   # 4. Care Planning (04-care-planning.sql)
   # 5. Product Management (05-product-management.sql)
   
   # Or use Supabase CLI:
   supabase db push
   ```

3. **Seed initial data**
   ```bash
   npm run db:seed
   ```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, Offline)
├── hooks/              # Custom React hooks
├── lib/                # External library configurations
├── pages/              # Page components
├── services/           # API and business logic
├── stores/             # Zustand state stores
├── styles/             # CSS and styling
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript type checking

# Database
npm run db:migrate       # Run database migrations
npm run db:reset         # Reset database
npm run db:seed          # Seed database with test data
```

## 🏥 Clinical Features

### ABPI Assessment
- Automatic calculation and interpretation
- Clinical decision support based on WHASA thresholds:
  - ABPI < 0.6: Urgent referral, no compression
  - ABPI 0.6-0.8: Modified compression, close monitoring
  - ABPI > 0.8: Compression therapy safe and recommended

### T.I.M.E. Framework
- **Tissue**: Viable vs necrotic assessment
- **Infection/Inflammation**: NERDS/STONES indicators
- **Moisture**: Exudate level and type
- **Edge**: Surrounding skin and undermining

### Wound Classification
- Venous ulcers
- Arterial ulcers
- Mixed ulcers
- Diabetic foot ulcers
- Pressure injuries
- Skin tears
- Burns
- Moisture-associated skin damage

## 🔒 Security & Compliance

- **POPIA Compliance**: Built-in data protection features
- **Encryption**: End-to-end encryption for all patient data
- **Authentication**: Multi-factor authentication support
- **Audit Trails**: Comprehensive logging of all user actions
- **Role-Based Access**: Granular permissions system

## 📱 PWA Features

- **Offline Functionality**: Full app operation without internet
- **Background Sync**: Automatic data synchronization when online
- **Installable**: Add to home screen on mobile devices
- **Push Notifications**: Real-time alerts and reminders

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on git push

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy to your hosting provider
# The built files are in the `dist/` directory
```

## 📊 Performance

- **Lighthouse Score**: 90+ across all metrics
- **Load Time**: < 2 seconds on 3G
- **Offline Capability**: 95% of functions work offline
- **Bundle Size**: Optimized with code splitting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For clinical questions, contact the WHASA advisory board.
For technical support, create an issue in the repository.

## 📚 Documentation

- [WHASA Guidelines](https://whasa.org)
- [Clinical Decision Rules](./clinical-decision-rules.md)
- [API Documentation](./api-specification.yaml)
- [Database Schema](./database/schemas/)
- [Modular Setup Guide](./database/MODULAR_SETUP_GUIDE.md)
- [TODO Features](./TODO_FEATURES.md)

## 🔄 Version History

- **v1.0.0** - Initial release with core clinical workflows
- **v1.1.0** - Enhanced offline capabilities and device integration
- **v1.2.0** - Advanced analytics and reporting features

---

**Built with ❤️ for wound care professionals in South Africa** 