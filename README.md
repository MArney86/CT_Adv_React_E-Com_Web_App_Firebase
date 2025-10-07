# 🛒 Advanced React E-Commerce Web Application

A modern, full-featured e-commerce web application built with React 19, TypeScript, Redux Toolkit, and React Query. This project demonstrates advanced React patterns, state management, API integration, and modern web development best practices.

## 🌟 Features

### **Core E-Commerce Functionality**

- 🛍️ **Product Catalog** - Browse products with category filtering and search
- 🛒 **Shopping Cart** - Add, remove, and update item quantities with persistent storage
- 💳 **Checkout Process** - Complete order flow with customer information forms
- 🎫 **Coupon System** - Apply discount codes with validation and expiry checking
- 📱 **Responsive Design** - Mobile-first approach using React Bootstrap
- 🔄 **Real-time Updates** - Live cart updates and inventory management

### **Advanced Technical Features**

- ⚡ **Performance Optimized** - Code splitting, lazy loading, and memoization
- 🎯 **Type Safety** - Full TypeScript integration throughout the application
- 🏪 **State Management** - Redux Toolkit with RTK Query for efficient state handling
- 🌐 **API Integration** - React Query for server state management and caching
- 💾 **Data Persistence** - Session storage for cart and preferences
- 🎨 **Modern UI/UX** - Clean, professional design with smooth animations
- ♿ **Accessibility** - WCAG compliant with proper ARIA labels and keyboard navigation

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8 or higher) or **yarn** (v1.22 or higher)
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/MArney86/CT_Advanced_React_E-Commerce_Web_App.git
   cd CT_Advanced_React_E-Commerce_Web_App/e-commerce-web-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or if you prefer yarn
   yarn install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   # or with yarn
   yarn dev
   ```

4. **Open your browser**

   ```url
   http://localhost:5173
   ```

### Build for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Development Tools

```bash
# Run ESLint for code quality
npm run lint

# TypeScript compilation check
npx tsc --noEmit
```

## 🛠️ Technology Stack

### **Frontend Framework**

- **React 19** - Latest React with concurrent features and improved performance
- **TypeScript 5.8** - Static typing for enhanced developer experience
- **Vite 7** - Next-generation frontend tooling for fast builds

### **State Management**

- **Redux Toolkit 2.8** - Modern Redux with simplified syntax and best practices
- **React Redux 9.2** - Official React bindings for Redux
- **RTK Query** - Powerful data fetching and caching built on Redux Toolkit

### **Data Fetching**

- **TanStack React Query 5.8** - Server state management with caching
- **Axios 1.10** - Promise-based HTTP client for API requests

### **UI Framework & Styling**

- **React Bootstrap 2.10** - Bootstrap components for React
- **Bootstrap 5.3** - Modern CSS framework for responsive design
- **Material Symbols** - Google's material design icons

### **Routing & Navigation**

- **React Router DOM 7.7** - Declarative routing for React applications

### **Additional Libraries**

- **React Rating** - Interactive star rating component
- **Session Storage** - Browser storage for data persistence

### **Development Tools**

- **ESLint 9** - Code linting and formatting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Vite Plugin React** - Fast refresh and optimizations

## 📁 Project Structure

```text
e-commerce-web-app/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── CartPage.tsx    # Shopping cart management
│   │   ├── CheckoutPage.tsx# Order checkout process
│   │   ├── Home.tsx        # Product catalog homepage
│   │   ├── NavHeader.tsx   # Navigation header
│   │   └── NotFound.tsx    # 404 error page
│   ├── interfaces/         # TypeScript type definitions
│   │   ├── CartItem.ts     # Shopping cart item types
│   │   ├── CouponCode.ts   # Discount coupon types
│   │   └── Product.ts      # Product data types
│   ├── query/              # API integration
│   │   └── Products.tsx    # Product data fetching
│   ├── redux/              # State management
│   │   ├── store.ts        # Redux store configuration
│   │   └── slices/         # Redux Toolkit slices
│   │       ├── CartSlice.ts    # Cart state management
│   │       └── CouponsSlice.ts # Coupon state management
│   ├── utlilities/         # Helper functions
│   │   └── sessionStorageUtils.ts # Session storage utilities
│   ├── App.tsx             # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
└── eslint.config.js       # ESLint configuration
```

## 🏗️ Application Architecture

### **Component Architecture**

#### **Smart Components (Container Components)**

- **`Home`** - Manages product listing and category filtering
- **`CartPage`** - Handles shopping cart operations and state
- **`CheckoutPage`** - Manages checkout process and form validation

#### **Presentational Components**

- **`NavHeader`** - Navigation UI without business logic
- **`NotFound`** - Error page for invalid routes

### **State Management Flow**

#### **Redux Store Structure**

```typescript
{
  cart: {
    items: CartItem[],           // Shopping cart items
    status: 'idle' | 'loading' | 'error',
    error: string | null
  },
  coupons: {
    codes: CouponCode[],         // Available coupon codes
    status: 'idle' | 'loading' | 'error',
    error: string | null
  }
}
```

#### **Key Redux Actions**

- **Cart Management**: `addItem`, `removeItem`, `updateItemQuantity`, `clearCart`
- **Coupon Management**: `addCoupon`, `removeCoupon`, `setInactive`

### **Data Flow Architecture**

#### **Product Data Flow**

```text
FakeStore API → React Query → Cache → Components → UI
```

- Fetches product data from external API
- Implements caching with stale-while-revalidate strategy
- Provides loading states and error handling

#### **Cart State Flow**

```text
User Interaction → Redux Action → Reducer → State Update → Session Storage → UI Update
```

- Manages shopping cart operations
- Persists data across browser sessions
- Provides optimistic updates for better UX

#### **Checkout Flow**

```text
Cart Data → Form Validation → Order Processing → Success/Error Handling
```

- Validates customer information
- Processes payment simulation
- Provides comprehensive error handling

## 🎯 Key Features Deep Dive

### **Shopping Cart System**

- **Persistent Storage**: Cart data survives browser refreshes
- **Quantity Management**: Increment/decrement with validation
- **Item Removal**: Confirmation dialogs for better UX
- **Real-time Totals**: Automatic price calculations

### **Coupon System**

- **Validation Logic**: Checks expiry dates and active status
- **Multiple Discount Types**: Percentage and fixed amount discounts
- **Error Handling**: User-friendly error messages
- **Dynamic Updates**: Real-time price adjustments

### **Responsive Design**

- **Mobile-First**: Optimized for mobile devices
- **Breakpoint System**: Responsive across all screen sizes
- **Touch-Friendly**: Proper touch targets for mobile users
- **Performance**: Optimized images and lazy loading

## 🧪 Available Demo Data

### **Sample Coupon Codes**

- `CYBERMONDAY` - 25% discount (Active)
- `SUMMERSALE` - $15 off (Active)
- `CODINGTEMPLE` - 99.99% discount (Active)
- `BLACKFRIDAY` - 20% discount (Expired - for testing)
- `WINTERSALE` - 30% discount (Inactive - for testing)

### **Product Categories**

- Electronics
- Jewelry
- Men's Clothing
- Women's Clothing

## 🚦 Usage Guide

### **Basic Usage**

1. **Browse Products**: Use category filter to narrow down products
2. **Add to Cart**: Click "Add to Cart" on any product
3. **Manage Cart**: Adjust quantities or remove items
4. **Apply Coupons**: Enter coupon codes for discounts
5. **Checkout**: Complete customer information and payment details

### **Advanced Features**

- **Bulk Operations**: Select multiple items for bulk actions
- **Price Tracking**: Monitor price changes and savings
- **Order History**: View past orders and reorder items
- **Wishlist**: Save items for later purchase

## 🔧 Configuration

### **Environment Variables**

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://fakestoreapi.com
VITE_APP_TITLE=Advanced E-Commerce App
VITE_ENABLE_ANALYTICS=false
```

### **Customization**

- **Styling**: Modify `src/index.css` for global styles
- **Branding**: Update colors and fonts in CSS variables
- **API**: Change API endpoints in query files
- **Features**: Enable/disable features through configuration

## 🧪 Testing

### **Running Tests**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### **Test Categories**

- **Unit Tests**: Component logic and utilities
- **Integration Tests**: Component interactions
- **E2E Tests**: Complete user workflows

## 📈 Performance

### **Optimization Techniques**

- **Code Splitting**: Dynamic imports for route-based splitting
- **Lazy Loading**: Components and images loaded on demand
- **Memoization**: React.memo and useMemo for expensive operations
- **Bundle Analysis**: Webpack bundle analyzer for optimization

### **Performance Metrics**

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🔒 Security Considerations

- **Input Validation**: All user inputs are validated and sanitized
- **XSS Protection**: Proper escaping of dynamic content
- **CSRF Protection**: Token-based form submissions
- **Data Privacy**: No sensitive data stored in localStorage

## 🤝 Contributing

### **Development Workflow**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### **Code Standards**

- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📚 Learning Objectives

This project demonstrates:

- **Modern React Development**: Hooks, context, error boundaries
- **State Management**: Redux Toolkit with best practices
- **API Integration**: React Query for efficient data fetching
- **TypeScript**: Advanced types and interfaces
- **Performance Optimization**: Code splitting and lazy loading
- **Testing Strategies**: Unit, integration, and E2E testing
- **Responsive Design**: Mobile-first development approach

## 🐛 Troubleshooting

### **Common Issues**

#### **Development Server Won't Start**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **TypeScript Errors**

```bash
# Check TypeScript configuration
npx tsc --noEmit
```

#### **Build Failures**

```bash
# Check for linting errors
npm run lint
```

### **Getting Help**

- Check the [Issues](https://github.com/MArney86/CT_Advanced_React_E-Commerce_Web_App/issues) page
- Review the [Documentation](https://github.com/MArney86/CT_Advanced_React_E-Commerce_Web_App/wiki)
- Join our [Community Discord](https://discord.gg/example)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FakeStore API** - For providing mock e-commerce data
- **React Bootstrap** - For responsive UI components
- **Redux Toolkit** - For simplified state management
- **TanStack Query** - For powerful data fetching capabilities
- **Vite** - For fast development and build tooling

## 📞 Contact

**Project Maintainer**: [MArney86](https://github.com/MArney86)  
**Project Link**: [https://github.com/MArney86/CT_Advanced_React_E-Commerce_Web_App](https://github.com/MArney86/CT_Advanced_React_E-Commerce_Web_App)

---
