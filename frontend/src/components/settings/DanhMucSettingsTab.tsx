'use client';

import React from 'react';
import { Card, Col, Row, Typography, Statistic } from 'antd';
import { DatabaseOutlined, TagsOutlined, TeamOutlined, ControlOutlined, FolderOpenOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function DanhMucSettingsTab() {
  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm" styles={{ body: { padding: '24px' } }}>
      <div className="mb-6">
        <Title level={4} className="!m-0 text-gray-800 flex items-center gap-2">
          <DatabaseOutlined className="text-blue-500" />
          Danh mục Cơ sở & Thông số Dùng chung
        </Title>
        <Text type="secondary" className="text-sm">
          Quản lý các danh mục phân loại hồ sơ, tình trạng hiệu lực và danh mục hỗ trợ hệ thống.
        </Text>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="border-emerald-100 bg-emerald-50/50 transition-all hover:-translate-y-1">
            <Statistic
              title={<span className="font-semibold text-gray-600">Loại Hồ Sơ</span>}
              value={6}
              prefix={<TagsOutlined className="text-emerald-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="border-blue-100 bg-blue-50/50 transition-all hover:-translate-y-1">
            <Statistic
              title={<span className="font-semibold text-gray-600">Trạng Thái Hồ Sơ</span>}
              value={6}
              prefix={<ControlOutlined className="text-blue-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="border-orange-100 bg-orange-50/50 transition-all hover:-translate-y-1">
            <Statistic
              title={<span className="font-semibold text-gray-600">Loại Tài Liệu</span>}
              value={10}
              prefix={<FolderOpenOutlined className="text-orange-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="border-purple-100 bg-purple-50/50 transition-all hover:-translate-y-1">
            <Statistic
              title={<span className="font-semibold text-gray-600">Vai Trò Hệ Thống</span>}
              value={4}
              prefix={<TeamOutlined className="text-purple-500 mr-2" />}
            />
          </Card>
        </Col>
      </Row>

      <div className="mt-12 text-center text-gray-400 py-8 border border-dashed border-gray-200 rounded-lg">
        <DatabaseOutlined className="text-4xl mb-3 text-gray-300" />
        <p className="text-sm">Tính năng thêm / sửa nhanh các thông số Danh mục đang được đồng bộ chuẩn hóa theo CSDL SCB.</p>
      </div>
    </Card>
  );
}
