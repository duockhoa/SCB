import React from 'react';
import { Card, Statistic } from 'antd';

interface Props {
  title: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
}

export default function StatCard({ title, value, icon, color = '#1890ff' }: Props) {
  return (
    <Card variant="borderless" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)', height: '100%' }}>
      <Statistic
        title={<span style={{ fontSize: '14px', fontWeight: 500, color: '#595959' }}>{title}</span>}
        value={value}
        prefix={icon && <span style={{ color, marginRight: '8px' }}>{icon}</span>}
        valueStyle={{ color, fontWeight: 'bold', marginTop: '8px' }}
      />
    </Card>
  );
}
