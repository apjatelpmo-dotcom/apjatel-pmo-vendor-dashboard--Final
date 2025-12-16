
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Project, ProjectStatus } from '../types';

interface DashboardChartsProps {
  projects: Project[];
}

const STATUS_COLORS = {
  [ProjectStatus.COMPLETED]: '#10b981', // green
  [ProjectStatus.IN_PROGRESS]: '#3b82f6', // blue
  [ProjectStatus.PLANNING]: '#8b5cf6', // purple
  [ProjectStatus.DELAYED]: '#ef4444', // red
  [ProjectStatus.ON_HOLD]: '#f59e0b', // amber
};

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16'];

export const ProjectStatusChart: React.FC<{ projects: Project[], onClick?: (status: string) => void }> = ({ projects, onClick }) => {
  const data = Object.values(ProjectStatus).map(status => ({
    name: status,
    value: projects.filter(p => p.status === status).length
  })).filter(d => d.value > 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={5}
            dataKey="value"
            onClick={(data) => onClick && onClick(data.name)}
            className={onClick ? "cursor-pointer" : ""}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as ProjectStatus]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const BudgetVsSpentChart: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const data = projects.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    Budget: p.budget,
    Spent: p.spent,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{fontSize: 10}} />
          <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} tick={{fontSize: 10}} />
          <Tooltip formatter={(value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(value))} />
          <Legend />
          <Bar dataKey="Budget" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Spent" fill="#64748b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// New Chart for Location & Vendor Distribution
export const CategoryBarChart: React.FC<{ data: { name: string, value: number }[], color?: string, onClick?: (val: string) => void, label: string }> = ({ data, color = '#3b82f6', onClick, label }) => {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
                dataKey="name" 
                tick={{fontSize: 10}} 
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
            />
            <YAxis tick={{fontSize: 10}} allowDecimals={false} />
            <Tooltip />
            <Bar 
                dataKey="value" 
                name={label}
                fill={color} 
                radius={[4, 4, 0, 0]} 
                onClick={(data) => onClick && onClick(data.name)}
                className={onClick ? "cursor-pointer" : ""}
                barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
};

// New Generic Chart for Operator Status Breakdowns (Material, Pulling, etc)
export const GenericDistributionChart: React.FC<{ data: { name: string, value: number }[], color?: string, onClick?: (category: string) => void }> = ({ data, color = '#3b82f6', onClick }) => {
    return (
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11}} />
            <Tooltip />
            <Bar 
                dataKey="value" 
                fill={color} 
                radius={[0, 4, 4, 0]} 
                barSize={20}
                onClick={(data) => onClick && onClick(data.name)}
                className={onClick ? "cursor-pointer" : ""}
            >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
