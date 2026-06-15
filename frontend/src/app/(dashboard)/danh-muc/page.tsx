'use client';

import { Card, Col, Row, Typography, Statistic } from 'antd';
import { DatabaseOutlined, TagsOutlined, TeamOutlined, ControlOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function DanhMucPage() {
  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="mb-8 border-b border-gray-100 pb-4">
        <Title level={3} className="text-gray-800 m-0">Quản lý Danh Mục</Title>
        <Text type="secondary">Quản lý các thông số cấu hình và danh mục hệ thống</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={6}>
          <Card hoverable className="border-emerald-100 bg-emerald-50 cursor-pointer transition-all hover:-translate-y-1">
            <Statistic
              title={<span className="font-semibold text-gray-600">Loại Sản Phẩm</span>}
              value={15}
              prefix={<TagsOutlined className="text-emerald-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable className="border-blue-100 bg-blue-50 cursor-pointer transition-all hover:-translate-y-1">
            <Statistic
              title={<span className="font-semibold text-gray-600">Trạng Thái</span>}
              value={8}
              prefix={<ControlOutlined className="text-blue-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable className="border-orange-100 bg-orange-50 cursor-pointer transition-all hover:-translate-y-1">
            <Statistic
              title={<span className="font-semibold text-gray-600">Kho Hàng</span>}
              value={4}
              prefix={<DatabaseOutlined className="text-orange-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable className="border-purple-100 bg-purple-50 cursor-pointer transition-all hover:-translate-y-1">
            <Statistic
              title={<span className="font-semibold text-gray-600">Phòng Ban</span>}
              value={12}
              prefix={<TeamOutlined className="text-purple-500 mr-2" />}
            />
          </Card>
        </Col>
      </Row>

      <div className="mt-12 text-center text-gray-400">
        <DatabaseOutlined className="text-4xl mb-4 opacity-50" />
        <p>Tính năng Cấu hình Danh Mục chi tiết sẽ được tích hợp trong Phase tiếp theo.</p>
      </div>
    </div>
  );
}
