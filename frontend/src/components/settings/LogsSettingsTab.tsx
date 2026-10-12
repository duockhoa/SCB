'use client';

import React, { useEffect, useState } from 'react';
import { Table, Typography, Tag, Modal, Button, Space, message, Card } from 'antd';
import { HistoryOutlined, SyncOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { axiosInstance } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

const { Title, Text } = Typography;

export default function LogsSettingsTab() {
  const { canViewSystemLogs } = usePermissions();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSyncUsers = async () => {
    setSyncing(true);
    try {
      const response = await axiosInstance.post('/sync/users');
      message.success(`Đã đồng bộ thành công ${response.data.totalSynced} người dùng từ HRM`);
      fetchLogs(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi đồng bộ người dùng');
    } finally {
      setSyncing(false);
    }
  };

  const fetchLogs = async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/logs', { params: { page, limit } });
      setLogs(data.data);
      setTotal(data.total);
      setPagination({ current: page, pageSize: limit });
    } catch (error) {
      console.error(error);
      message.error('Không thể tải dữ liệu nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewSystemLogs) {
      fetchLogs(pagination.current, pagination.pageSize);
    }
  }, [canViewSystemLogs]);

  const handleTableChange = (pag: any) => {
    fetchLogs(pag.current, pag.pageSize);
  };

  const showDetails = (log: any) => {
    setSelectedLog(log);
    setIsModalVisible(true);
  };

  const renderMethodTag = (method: string) => {
    let color = 'default';
    if (method === 'POST') color = 'green';
    else if (method === 'PUT' || method === 'PATCH') color = 'orange';
    else if (method === 'DELETE') color = 'red';
    else if (method === 'GET') color = 'blue';

    return <Tag color={color}>{method}</Tag>;
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Người dùng',
      key: 'nguoi_dung',
      render: (_: any, record: any) => {
        if (!record.nguoi_dung) return <Text type="secondary">N/A</Text>;
        return <Text strong>{record.nguoi_dung.ho_ten} ({record.nguoi_dung.ma_nguoi_dung})</Text>;
      }
    },
    {
      title: 'Phương thức',
      dataIndex: 'phuong_thuc',
      key: 'phuong_thuc',
      width: 110,
      render: (val: string) => renderMethodTag(val),
    },
    {
      title: 'Đường dẫn (API URL)',
      dataIndex: 'duong_dan',
      key: 'duong_dan',
      ellipsis: true,
    },
    {
      title: 'HTTP Status',
      dataIndex: 'status_code',
      key: 'status_code',
      width: 110,
      render: (val: number) => (
        <Tag color={val >= 200 && val < 300 ? 'success' : 'error'}>
          {val || 'N/A'}
        </Tag>
      )
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
    },
    {
      title: 'Chi tiết',
      key: 'action',
      width: 90,
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => showDetails(record)}>Xem</Button>
      ),
    },
  ];

  if (!canViewSystemLogs) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
        Bạn không có quyền xem nhật ký hệ thống.
      </div>
    );
  }

  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm" styles={{ body: { padding: '24px' } }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Title level={4} className="!m-0 text-gray-800 flex items-center gap-2">
            <HistoryOutlined className="text-blue-500" />
            Nhật ký Hoạt động Hệ thống
          </Title>
          <Text type="secondary" className="text-sm">
            Ghi nhận và kiểm toán mọi thao tác thêm, sửa, xóa và truy cập API trên hệ thống SCB.
          </Text>
        </div>
        <Space>
          <Button icon={<SyncOutlined />} type="primary" loading={syncing} onClick={handleSyncUsers}>
            Đồng bộ User từ HRM
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchLogs(1, pagination.pageSize)}>
            Làm mới
          </Button>
        </Space>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={logs} 
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Tổng cộng ${t} bản ghi nhật ký`
        }}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="Chi tiết Dữ liệu Payload gửi lên"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedLog?.chi_tiet ? (
          <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto max-h-[500px] text-xs font-mono">
            {JSON.stringify(JSON.parse(selectedLog.chi_tiet), null, 2)}
          </pre>
        ) : (
          <Text type="secondary">Không có dữ liệu payload chi tiết.</Text>
        )}
      </Modal>
    </Card>
  );
}
