'use client';

import React, { useEffect, useState } from 'react';
import { Table, Typography, Select, Button, Space, message, Card, Input } from 'antd';
import { axiosInstance } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function UserManagementPage() {
  const router = useRouter();
  const { isDeveloper } = usePermissions();

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [changedRoles, setChangedRoles] = useState<Record<number, number | null>>({});

  // Gating page check
  useEffect(() => {
    if (!isDeveloper) {
      message.error('Bạn không có quyền truy cập trang này');
      router.push('/');
    }
  }, [isDeveloper, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        axiosInstance.get('/users'),
        axiosInstance.get('/users/roles'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setChangedRoles({});
    } catch (error) {
      console.error(error);
      message.error('Không thể tải danh sách người dùng và vai trò');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncUsers = async () => {
    setSyncing(true);
    try {
      const response = await axiosInstance.post('/sync/users');
      message.success(`Đã đồng bộ thành công ${response.data.totalSynced} người dùng từ HRM`);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi đồng bộ người dùng');
    } finally {
      setSyncing(false);
    }
  };

  const handleRoleChange = async (userId: number, roleId: number | null) => {
    try {
      await axiosInstance.put(`/users/${userId}/role`, { roleId });
      message.success('Cập nhật vai trò người dùng thành công');
      fetchData(); // Reload to get fresh roles
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Không thể cập nhật vai trò');
    }
  };

  useEffect(() => {
    if (isDeveloper) {
      fetchData();
    }
  }, [isDeveloper]);

  const columns = [
    {
      title: 'Mã nhân sự',
      dataIndex: 'ma_nguoi_dung',
      key: 'ma_nguoi_dung',
      width: 150,
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (val: string) => val || <Text type="secondary">-</Text>,
    },
    {
      title: 'Bộ phận',
      dataIndex: 'phong_ban',
      key: 'phong_ban',
      width: 180,
      render: (val: string) => val || <Text type="secondary">-</Text>,
    },
    {
      title: 'Chức vụ',
      dataIndex: 'chuc_vu',
      key: 'chuc_vu',
      width: 150,
      render: (val: string) => val || <Text type="secondary">-</Text>,
    },
    {
      title: 'Quyền hạn (Vai trò)',
      key: 'role',
      width: 280,
      render: (_: any, record: any) => {
        const currentValue = changedRoles[record.id] !== undefined ? changedRoles[record.id] : record.vai_tro_id;
        const isChanged = changedRoles[record.id] !== undefined && changedRoles[record.id] !== record.vai_tro_id;

        return (
          <Space>
            <Select
              style={{ width: 180 }}
              value={currentValue}
              onChange={(val) => {
                setChangedRoles(prev => ({
                  ...prev,
                  [record.id]: val
                }));
              }}
              options={[
                { value: null, label: 'Chưa cấu hình (Mặc định)' },
                ...roles.map((r) => ({
                  value: r.id,
                  label: `${r.ten_vai_tro} (${r.ma_vai_tro})`,
                })),
              ]}
            />
            {isChanged && (
              <Button 
                type="primary" 
                size="small" 
                onClick={async () => {
                  await handleRoleChange(record.id, currentValue);
                  setChangedRoles(prev => {
                    const next = { ...prev };
                    delete next[record.id];
                    return next;
                  });
                }}
              >
                Lưu
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const filteredUsers = users.filter((u) => {
    const searchLower = searchText.toLowerCase();
    return (
      (u.ho_ten && u.ho_ten.toLowerCase().includes(searchLower)) ||
      (u.ma_nguoi_dung && u.ma_nguoi_dung.toLowerCase().includes(searchLower)) ||
      (u.email && u.email.toLowerCase().includes(searchLower)) ||
      (u.phong_ban && u.phong_ban.toLowerCase().includes(searchLower)) ||
      (u.chuc_vu && u.chuc_vu.toLowerCase().includes(searchLower))
    );
  });

  if (!isDeveloper) return null;

  return (
    <div className="p-6">
      <Card style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={4} className="!m-0">Quản lý Quyền Người Dùng</Title>
            <Text type="secondary">Cấu hình vai trò cục bộ cho lập trình viên (Dev) và các cấp quản lý khác để kiểm soát quyền cập nhật/xóa hồ sơ.</Text>
          </div>
          <Space>
            <Button type="primary" loading={syncing} onClick={handleSyncUsers}>
              Đồng bộ từ HRM
            </Button>
            <Button onClick={fetchData}>Làm mới</Button>
          </Space>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Input.Search
            placeholder="Tìm kiếm theo tên, mã nhân sự, email, bộ phận, chức vụ..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 455 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (t) => `Tổng số ${t} người dùng`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
