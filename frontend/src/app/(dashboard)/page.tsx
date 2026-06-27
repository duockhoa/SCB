'use client';

import React, { useState } from 'react';
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
import { calculateDashboardStats, getListByCategory } from '@/utils/dashboard-stats';
import StatCard from '@/components/dashboard/StatCard';
import ExpiryAlertTable from '@/components/dashboard/ExpiryAlertTable';
import { useRouter } from 'next/navigation';

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

  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('SAP_HET_HAN');
  const stats = calculateDashboardStats(hoSoList);
  const currentList = getListByCategory(hoSoList, activeCategory);

  const getTableProps = () => {
    switch(activeCategory) {
      case 'SAP_HET_HAN': return { title: 'Cảnh báo Hồ sơ Sắp hết hạn ưu tiên xử lý', color: '#fa8c16' };
      case 'DA_HET_HAN': return { title: 'Cảnh báo Hồ sơ Đã hết hạn', color: '#f5222d' };
      case 'DANG_XU_LY': return { title: 'Danh sách Hồ sơ Đang xử lý', color: '#faad14' };
      case 'CON_HIEU_LUC': return { title: 'Danh sách Hồ sơ Còn hiệu lực', color: '#52c41a' };
      case 'DA_BI_THAY_THE': return { title: 'Danh sách Hồ sơ Đã bị thay thế', color: '#722ed1' };
      case 'BI_THU_HOI': return { title: 'Danh sách Hồ sơ Bị thu hồi', color: '#8c8c8c' };
      default: return { title: 'Danh sách Hồ sơ', color: '#1890ff' };
    }
  };

  const tableProps = getTableProps();

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', background: '#f0f2f5', overflow: 'hidden' }}>
      <Title level={2} style={{ marginBottom: '24px', flexShrink: 0 }}>Tổng quan Hệ thống</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px', flexShrink: 0 }}>
        <Col xs={24} sm={12} md={8} lg={6} xl={3}>
          <StatCard title="Tổng hồ sơ" value={stats.tongSo} icon={<FolderOpenOutlined />} color="#1890ff" onClick={() => router.push('/ho-so')} />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <StatCard title="Đang xử lý" value={stats.dangXuLy} icon={<SyncOutlined spin={stats.dangXuLy > 0} />} color="#faad14" isActive={activeCategory === 'DANG_XU_LY'} onClick={() => setActiveCategory('DANG_XU_LY')} />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <StatCard title="Còn hiệu lực" value={stats.conHieuLuc} icon={<CheckCircleOutlined />} color="#52c41a" isActive={activeCategory === 'CON_HIEU_LUC'} onClick={() => setActiveCategory('CON_HIEU_LUC')} />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <StatCard title="Sắp hết hạn" value={stats.sapHetHan} icon={<WarningOutlined />} color="#fa8c16" isActive={activeCategory === 'SAP_HET_HAN'} onClick={() => setActiveCategory('SAP_HET_HAN')} />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={3}>
          <StatCard title="Đã hết hạn" value={stats.daHetHan} icon={<CloseCircleOutlined />} color="#f5222d" isActive={activeCategory === 'DA_HET_HAN'} onClick={() => setActiveCategory('DA_HET_HAN')} />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={3}>
          <StatCard title="Thay thế" value={stats.thayThe} icon={<SwapOutlined />} color="#722ed1" isActive={activeCategory === 'DA_BI_THAY_THE'} onClick={() => setActiveCategory('DA_BI_THAY_THE')} />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={3}>
          <StatCard title="Thu hồi" value={stats.thuHoi} icon={<StopOutlined />} color="#8c8c8c" isActive={activeCategory === 'BI_THU_HOI'} onClick={() => setActiveCategory('BI_THU_HOI')} />
        </Col>
      </Row>

      <div style={{ flex: 1, minHeight: 0, background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Title level={4} style={{ margin: 0, padding: '16px 24px', color: tableProps.color, flexShrink: 0, borderBottom: '1px solid #f0f0f0' }}>
          {['SAP_HET_HAN', 'DA_HET_HAN'].includes(activeCategory) && <WarningOutlined style={{ marginRight: '8px' }} />}
          {tableProps.title}
        </Title>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <ExpiryAlertTable data={currentList} />
        </div>
      </div>
    </div>
  );
}
