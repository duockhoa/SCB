'use client';

import React, { useEffect, useState } from 'react';
import { Table, Typography, Select, Button, Space, message, Card, Input, Modal, Tag, Divider, Empty, Descriptions } from 'antd';
import { 
  SyncOutlined, 
  ReloadOutlined, 
  UserOutlined, 
  SafetyCertificateOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { axiosInstance } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

const { Title, Text } = Typography;

export default function UserSettingsTab() {
  const { isDeveloper, isAdmin, canManageUsers } = usePermissions();
  const canAccess = isDeveloper || isAdmin || canManageUsers;

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionModules, setPermissionModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [changedRoles, setChangedRoles] = useState<Record<number, number | null>>({});
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        axiosInstance.get('/users'),
        axiosInstance.get('/users/roles'),
        axiosInstance.get('/users/permissions'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setPermissionModules(permsRes.data || []);
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
      fetchData();
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Không thể cập nhật vai trò');
    }
  };

  useEffect(() => {
    if (canAccess) {
      fetchData();
    }
  }, [canAccess]);

  const columns = [
    {
      title: 'Mã nhân sự',
      dataIndex: 'ma_nguoi_dung',
      key: 'ma_nguoi_dung',
      width: 140,
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      width: 180,
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
      width: 160,
      render: (val: string) => val || <Text type="secondary">-</Text>,
    },
    {
      title: 'Chức vụ',
      dataIndex: 'chuc_vu',
      key: 'chuc_vu',
      width: 140,
      render: (val: string) => val || <Text type="secondary">-</Text>,
    },
    {
      title: 'Quyền hạn (Vai trò RBAC)',
      key: 'role',
      width: 320,
      render: (_: any, record: any) => {
        const currentValue = changedRoles[record.id] !== undefined ? changedRoles[record.id] : record.vai_tro_id;
        const isChanged = changedRoles[record.id] !== undefined && changedRoles[record.id] !== record.vai_tro_id;

        return (
          <Space>
            <Select
              style={{ width: 220 }}
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
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      render: (_: any, record: any) => (
        <Button
          size="small"
          icon={<SafetyCertificateOutlined className="text-blue-500" />}
          onClick={() => setSelectedUserForPerms(record)}
        >
          Xem quyền
        </Button>
      ),
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

  if (!canAccess) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
        Bạn không có quyền quản lý người dùng.
      </div>
    );
  }

  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm" styles={{ body: { padding: '24px' } }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Title level={4} className="!m-0 text-gray-800 flex items-center gap-2">
            <UserOutlined className="text-blue-500" />
            Người dùng & Phân quyền tài khoản
          </Title>
          <Text type="secondary" className="text-sm">
            Đồng bộ thông tin nhân sự từ hệ thống HRM và gán vai trò quyền hạn trong hệ thống SCB.
          </Text>
        </div>
        <Space>
          <Button icon={<SyncOutlined />} type="primary" loading={syncing} onClick={handleSyncUsers}>
            Đồng bộ từ HRM
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Làm mới
          </Button>
        </Space>
      </div>

      <div className="mb-4">
        <Input.Search
          placeholder="Tìm kiếm theo họ tên, mã nhân sự, email, bộ phận, chức vụ..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 450 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showTotal: (t) => `Tổng cộng ${t} người dùng`,
          pageSize: 15,
        }}
        scroll={{ x: 1000 }}
      />

      {/* Modal Chi tiết quyền hạn của người dùng */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base text-gray-800">
            <SafetyCertificateOutlined className="text-blue-600" />
            Chi tiết quyền hạn nhân sự
          </div>
        }
        open={!!selectedUserForPerms}
        onCancel={() => setSelectedUserForPerms(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSelectedUserForPerms(null)}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {selectedUserForPerms && (() => {
          const userRoleId = selectedUserForPerms.vai_tro_id || selectedUserForPerms.vai_tro?.id;
          const assignedRole = roles.find((r) => r.id === userRoleId);
          const userPerms: string[] = assignedRole?.permissions || [];
          const hasWildcard = userPerms.includes('*');

          return (
            <div className="py-2 space-y-4">
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Mã nhân sự">
                  <Text strong>{selectedUserForPerms.ma_nguoi_dung}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Họ và tên">
                  {selectedUserForPerms.ho_ten}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedUserForPerms.email || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Phòng ban">
                  {selectedUserForPerms.phong_ban || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Chức vụ">
                  {selectedUserForPerms.chuc_vu || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Vai trò RBAC">
                  {assignedRole ? (
                    <Tag color="blue" className="font-medium">
                      {assignedRole.ten_vai_tro} ({assignedRole.ma_vai_tro})
                    </Tag>
                  ) : (
                    <Tag color="default">Chưa phân vai trò RBAC</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>

              <Divider className="my-2" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Text strong className="text-sm text-gray-800">
                    Danh sách quyền truy cập & thao tác thực tế:
                  </Text>
                  {hasWildcard && (
                    <Tag color="gold" className="font-bold">
                      QUYỀN QUẢN TRỊ TỐI CAO (*)
                    </Tag>
                  )}
                </div>

                {!assignedRole ? (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm flex items-start gap-2">
                    <InfoCircleOutlined className="mt-0.5" />
                    <div>
                      <div className="font-semibold">Nhân sự này chưa được gán vai trò RBAC cụ thể.</div>
                      <div className="text-xs text-amber-700 mt-1">
                        Hệ thống đang áp dụng cơ chế phân quyền kế thừa theo Phòng ban ({selectedUserForPerms.phong_ban || 'N/A'}) và Chức vụ ({selectedUserForPerms.chuc_vu || 'N/A'}).
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                    {permissionModules.map((mod: any) => {
                      return (
                        <div key={mod.module} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                          <div className="font-medium text-gray-800 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>{mod.module} - {mod.description}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mod.permissions.map((p: any) => {
                              const isGranted = hasWildcard || userPerms.includes(p.code);
                              return (
                                <div
                                  key={p.code}
                                  className={`p-2 rounded border text-xs flex items-start gap-2 ${
                                    isGranted
                                      ? 'bg-blue-50/60 border-blue-200 text-gray-800'
                                      : 'bg-white border-gray-100 text-gray-400 opacity-60'
                                  }`}
                                >
                                  {isGranted ? (
                                    <CheckCircleOutlined className="text-emerald-500 mt-0.5 text-sm shrink-0" />
                                  ) : (
                                    <CloseCircleOutlined className="text-gray-300 mt-0.5 text-sm shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-semibold flex items-center gap-1">
                                      {p.name}
                                      {p.isDangerous && isGranted && (
                                        <Tag color="error" className="!text-[10px] !px-1 !py-0 !leading-tight">
                                          Nhạy cảm
                                        </Tag>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-gray-500 truncate">{p.description}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </Card>
  );
}
