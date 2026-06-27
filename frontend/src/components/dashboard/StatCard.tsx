import React from 'react';
import { Card, Statistic } from 'antd';

interface Props {
  title: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export default function StatCard({ title, value, icon, color = '#1890ff', isActive = false, onClick }: Props) {
  return (
    <Card 
      variant="borderless" 
      onClick={onClick}
      style={{ 
        boxShadow: isActive ? `0 0 0 2px ${color}33, 0 4px 12px rgba(0,0,0,0.15)` : '0 1px 2px rgba(0,0,0,0.05)', 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        border: isActive ? `1px solid ${color}` : '1px solid transparent',
        transition: 'all 0.3s ease'
      }}
    >
      <Statistic
        title={<span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500, color: isActive ? color : '#595959' }}>{title}</span>}
        value={value}
        prefix={icon && <span style={{ color, marginRight: '8px' }}>{icon}</span>}
        valueStyle={{ color, fontWeight: 'bold', marginTop: '8px' }}
      />
    </Card>
  );
}
