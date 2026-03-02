interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'green' | 'red' | 'blue';
}

const variantStyles = {
  default: 'bg-white border-gray-200/60',
  green: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60',
  red: 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200/60',
  blue: 'bg-gradient-to-br from-violet-50 to-indigo-50 border-indigo-200/60',
};

export default function KpiCard({ title, value, subtitle, variant = 'default' }: KpiCardProps) {
  return (
    <div className={`rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${variantStyles[variant]}`}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
