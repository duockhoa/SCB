'use client';

import React, { useEffect, useState } from 'react';
import { Table, Typography, Tag, Modal, Button, Space, message } from 'antd';
import dayjs from 'dayjs';
import { axiosInstance } from '@/services/api';

const { Title, Text } = Typography;

export default function SystemLogsPage() {
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
    fetchLogs(pagination.current, pagination.pageSize);
  }, []);

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
      width: 180,
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
      title: 'Hành động',
      dataIndex: 'phuong_thuc',
      key: 'phuong_thuc',
      width: 100,
      render: (val: string) => renderMethodTag(val),
    },
    {
      title: 'Đường dẫn (URL)',
      dataIndex: 'duong_dan',
      key: 'duong_dan',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status_code',
      key: 'status_code',
      width: 100,
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
      width: 150,
    },
    {
      title: 'Chi tiết',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => showDetails(record)}>Xem</Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="!m-0">Nhật ký Hệ thống (System Logs)</Title>
        <Space>
          <Button type="primary" loading={syncing} onClick={handleSyncUsers}>
            Đồng bộ User từ HRM
          </Button>
          <Button onClick={() => fetchLogs(1, pagination.pageSize)}>Làm mới</Button>
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
          showTotal: (t) => `Tổng số ${t} bản ghi`
        }}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="Chi tiết Payload (Dữ liệu gửi lên)"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedLog?.chi_tiet ? (
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px] text-sm">
            {JSON.stringify(JSON.parse(selectedLog.chi_tiet), null, 2)}
          </pre>
        ) : (
          <Text type="secondary">Không có dữ liệu payload</Text>
        )}
      </Modal>
    </div>
  );
}
