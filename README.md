# capstone-updated
kakai's kutkutin wholesale and retail system: inventory management, sales control and analytics profitability.

## Quick Start

### Development Setup
1. Install dependencies: `pnpm install`
2. Copy environment file: `cp .env.example .env.local`
3. Update database configuration in `.env.local`
4. Import database schema: `mysql -u username -p database_name < schema.sql`
5. Start development server: `pnpm dev`

### Production Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Features
- Inventory Management
- Point of Sale (POS) System
- Analytics & Reporting
- User Role Management (Admin, Stockman, Cashier)
- Real-time Alerts
- PDF Export Functionality

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: PHP 8.1+, MySQL
- **UI Components**: Radix UI
- **Charts**: Recharts
- **PDF Generation**: @react-pdf/renderer
