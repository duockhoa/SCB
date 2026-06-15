'use client';

import React from 'react';
import { Row, Col, Typography, Spin } from 'antd';
import { 
  FolderOpenOutlined, 
  SyncOutlined, 
  CheckCircleOutlined, 
  WarningOutlined, 
  CloseCircleOutlined,
  SwapOutlined,
  StopOutlined
} from '@ant-design/icons';
import { useHoSoList } from '@/hooks/queries/useHoSo';
import { calculateDashboardStats, getAlertList } from '@/utils/dashboard-stats';
import StatCard from '@/components/dashboard/StatCard';
import ExpiryAlertTable from '@/components/dashboard/ExpiryAlertTable';

const { Title } = Typography;

export default function DashboardPage() {
  const { data: result, isLoading } = useHoSoList({ limit: 1000 });
  const hoSoList = result?.data?.data || [];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" description="Đang tải dữ liệu Dashboard..." />
      </div>
    );
  }

  const stats = calculateDashboardStats(hoSoList);
  const alertList = getAlertList(hoSoList);

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', background: '#f0f2f5', overflow: 'hidden' }}>
      <Title level={2} style={{ marginBottom: '24px', flexShrink: 0 }}>Tổng quan Hệ thống</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px', flexShrink: 0 }}>
        <Col xs={24} sm={12} md={8} lg={6} xl={3}>
          <StatCard title="Tổng hồ sơ" value={stats.tongSo} icon={<FolderOpenOutlined />} color="#1890ff" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <StatCard title="Đang xử lý" value={stats.dangXuLy} icon={<SyncOutlined spin={stats.dangXuLy > 0} />} color="#faad14" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <StatCard title="Còn hiệu lực" value={stats.conHieuLuc} icon={<CheckCircleOutlined />} color="#52c41a" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <StatCard title="Sắp hết hạn" value={stats.sapHetHan} icon={<WarningOutlined />} color="#fa8c16" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={3}>
          <StatCard title="Đã hết hạn" value={stats.daHetHan} icon={<CloseCircleOutlined />} color="#f5222d" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={3}>
          <StatCard title="Thay thế" value={stats.thayThe} icon={<SwapOutlined />} color="#722ed1" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={3}>
          <StatCard title="Thu hồi" value={stats.thuHoi} icon={<StopOutlined />} color="#8c8c8c" />
        </Col>
      </Row>

      <div style={{ flex: 1, minHeight: 0, background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Title level={4} style={{ margin: 0, padding: '16px 24px', color: '#f5222d', flexShrink: 0, borderBottom: '1px solid #f0f0f0' }}>
          <WarningOutlined style={{ marginRight: '8px' }} />
          Cảnh báo Hồ sơ Sắp / Đã hết hạn ưu tiên xử lý
        </Title>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <ExpiryAlertTable data={alertList} />
        </div>
      </div>
    </div>
  );
}
