interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'green' | 'red' | 'blue';
}

const variantColors = {
  default: 'bg-white',
  green: 'bg-green-50 border-green-200',
  red: 'bg-red-50 border-red-200',
  blue: 'bg-blue-50 border-blue-200',
};

export default function KpiCard({ title, value, subtitle, variant = 'default' }: KpiCardProps) {
  return (
    <div className={`rounded-lg border p-6 ${variantColors[variant]}`}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
