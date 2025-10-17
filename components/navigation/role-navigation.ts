import {
  Home,
  CreditCard,
  FileText,
  User,
  Settings,
  Users,
  BarChart4,
  DollarSign,
  Wallet,
  Calculator,
  ClipboardCheck,
  PieChart,
  History,
} from "lucide-react";

export const navigationConfig = {
  student: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Make Payment", href: "/make-payment", icon: CreditCard },
    { name: "Payment History", href: "/payment-history", icon: FileText },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ],
  admin: [
    { name: "Dashboard", href: "/admin/dashboard", icon: Home },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Fee Plans", href: "/admin/fee-plans", icon: Calculator },
    { name: "Reports", href: "/admin/reports", icon: FileText },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart4 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ],
  cashier: [
    { name: "Dashboard", href: "/cashier/dashboard", icon: Home },
    { name: "Payments", href: "/cashier/payments", icon: CreditCard },
    { name: "Transactions", href: "/cashier/transactions", icon: History },
    { name: "Settings", href: "/cashier/settings", icon: Settings },
  ],
  "business-office": [
    { name: "Dashboard", href: "/business-office/dashboard", icon: Home },
    {
      name: "Financial Reports",
      href: "/business-office/reports",
      icon: FileText,
    },
    {
      name: "Collections",
      href: "/business-office/collections",
      icon: DollarSign,
    },
    {
      name: "Budget Management",
      href: "/business-office/budget",
      icon: Wallet,
    },
    { name: "Analytics", href: "/business-office/analytics", icon: BarChart4 },
    {
      name: "Reconciliation",
      href: "/business-office/reconciliation",
      icon: ClipboardCheck,
    },
    {
      name: "Forecasting",
      href: "/business-office/forecasting",
      icon: PieChart,
    },
    { name: "Expenses", href: "/business-office/expenses", icon: Calculator },
    { name: "Settings", href: "/business-office/settings", icon: Settings },
  ],
};

export const roleDisplayNames = {
  student: "Student Portal",
  admin: "Admin Panel",
  cashier: "Cashier Portal",
  "business-office": "Business Office",
};
