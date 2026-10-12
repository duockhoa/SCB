'use client';

import React, { useEffect, useState } from 'react';
import { 
  Typography, Button, Space, message, Card, Modal, Form, 
  Input, Tag, Checkbox, Popconfirm, Tooltip, Badge, Segmented,
  Row, Col, Switch, Alert, Spin, Empty
} from 'antd';
import { 
  SafetyCertificateOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  SaveOutlined,
  AppstoreOutlined,
  TableOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons';
import { axiosInstance } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

const { Title, Text, Paragraph } = Typography;

interface PermissionItem {
  code: string;
  name: string;
  description: string;
  isDangerous?: boolean;
}

interface PermissionModule {
  module: string;
  description: string;
  permissions: PermissionItem[];
}

interface RoleItem {
  id: number;
  ma_vai_tro: string;
  ten_vai_tro: string;
  mo_ta: string | null;
  quyen_han: string | null;
  permissions: string[];
  userCount: number;
}

interface UserSummary {
  id: number;
  ma_nguoi_dung: string;
  ho_ten: string;
  phong_ban: string | null;
  chuc_vu: string | null;
}

export default function RolesManagementTab() {
  const { canManageRoles, canRolesCreate, canRolesUpdate, canRolesDelete, isAdmin, isDeveloper } = usePermissions();
  const canAccess = isDeveloper || isAdmin || canManageRoles;

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissionModules, setPermissionModules] = useState<PermissionModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'matrix' | 'inspector'>('matrix');

  // Quản lý thay đổi phân quyền trong chế độ Ma trận (Matrix Grid)
  // roleId -> Set<permissionCode>
  const [matrixState, setMatrixState] = useState<Record<number, string[]>>({});
  const [dirtyRoleIds, setDirtyRoleIds] = useState<number[]>([]);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [matrixSearch, setMatrixSearch] = useState('');

  // Chế độ Inspector (từng vai trò)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [roleUsers, setRoleUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Modal tạo / sửa vai trò
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [roleForm] = Form.useForm();
  const [submittingRole, setSubmittingRole] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/users/roles');
      const roleList: RoleItem[] = res.data;
      setRoles(roleList);

      // Cập nhật ma trận
      const stateMap: Record<number, string[]> = {};
      roleList.forEach((r) => {
        stateMap[r.id] = r.permissions || [];
      });
      setMatrixState(stateMap);
      setDirtyRoleIds([]);

      // Nếu chưa chọn vai trò cho chế độ Inspector thì chọn vai trò đầu tiên
      if (!selectedRoleId && roleList.length > 0) {
        setSelectedRoleId(roleList[0].id);
      }
    } catch (error) {
      console.error(error);
      message.error('Không thể tải danh sách nhóm vai trò');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await axiosInstance.get('/users/permissions');
      // Gán cờ nguy hiểm cho các hành động xóa / thay thế
      const modules: PermissionModule[] = res.data.map((m: PermissionModule) => ({
        ...m,
        permissions: m.permissions.map((p: PermissionItem) => ({
          ...p,
          isDangerous: ['HOSO_DELETE', 'HOSO_THAY_THE'].includes(p.code),
        })),
      }));
      setPermissionModules(modules);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsersForRole = async (roleId: number) => {
    setLoadingUsers(true);
    try {
      const res = await axiosInstance.get('/users');
      const allUsers: any[] = res.data;
      const matched = allUsers
        .filter((u) => u.vai_tro_id === roleId)
        .map((u) => ({
          id: u.id,
          ma_nguoi_dung: u.ma_nguoi_dung,
          ho_ten: u.ho_ten,
          phong_ban: u.phong_ban,
          chuc_vu: u.chuc_vu,
        }));
      setRoleUsers(matched);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (canManageRoles) {
      fetchRoles();
      fetchPermissions();
    }
  }, [canManageRoles]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchUsersForRole(selectedRoleId);
    }
  }, [selectedRoleId]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  // Helper đổi quyền trong ma trận
  const handleTogglePermInMatrix = (roleId: number, permCode: string, checked: boolean) => {
    const role = roles.find((r) => r.id === roleId);
    if (role?.ma_vai_tro === 'ADMIN') return; // Admin luôn có full quyền

    setMatrixState((prev) => {
      const currentList = prev[roleId] || [];
      const nextList = checked
        ? Array.from(new Set([...currentList, permCode]))
        : currentList.filter((c) => c !== permCode);

      return {
        ...prev,
        [roleId]: nextList,
      };
    });

    if (!dirtyRoleIds.includes(roleId)) {
      setDirtyRoleIds((prev) => [...prev, roleId]);
    }
  };

  const handleToggleAllForRole = (roleId: number, checkAll: boolean) => {
    const role = roles.find((r) => r.id === roleId);
    if (role?.ma_vai_tro === 'ADMIN') return;

    const allCodes = permissionModules.flatMap((m) => m.permissions.map((p) => p.code));
    setMatrixState((prev) => ({
      ...prev,
      [roleId]: checkAll ? allCodes : [],
    }));

    if (!dirtyRoleIds.includes(roleId)) {
      setDirtyRoleIds((prev) => [...prev, roleId]);
    }
  };

  const handleSaveMatrixChanges = async () => {
    if (dirtyRoleIds.length === 0) return;
    setSavingMatrix(true);
    try {
      await Promise.all(
        dirtyRoleIds.map((rId) =>
          axiosInstance.put(`/users/roles/${rId}`, {
            quyen_han: matrixState[rId] || [],
          })
        )
      );
      message.success(`Đã lưu thành công phân quyền cho ${dirtyRoleIds.length} nhóm vai trò!`);
      setDirtyRoleIds([]);
      fetchRoles();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu ma trận phân quyền');
    } finally {
      setSavingMatrix(false);
    }
  };

  // Tạo / Sửa vai trò
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    roleForm.resetFields();
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: RoleItem) => {
    setEditingRole(role);
    roleForm.setFieldsValue({
      ma_vai_tro: role.ma_vai_tro,
      ten_vai_tro: role.ten_vai_tro,
      mo_ta: role.mo_ta,
    });
    setIsRoleModalOpen(true);
  };

  const handleSaveRoleInfo = async (values: any) => {
    setSubmittingRole(true);
    try {
      if (editingRole) {
        await axiosInstance.put(`/users/roles/${editingRole.id}`, {
          ten_vai_tro: values.ten_vai_tro,
          mo_ta: values.mo_ta,
        });
        message.success('Cập nhật thông tin vai trò thành công');
      } else {
        await axiosInstance.post('/users/roles', values);
        message.success('Tạo vai trò mới thành công');
      }
      setIsRoleModalOpen(false);
      fetchRoles();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu vai trò');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    try {
      await axiosInstance.delete(`/users/roles/${roleId}`);
      message.success('Xóa vai trò thành công');
      fetchRoles();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể xóa vai trò này');
    }
  };

  const getRoleBadgeColor = (code: string) => {
    if (code === 'ADMIN') return 'magenta';
    if (code === 'TRUONG_PHONG') return 'geekblue';
    if (code === 'NV_DANG_KY') return 'cyan';
    if (code === 'EDITOR') return 'orange';
    if (code === 'KIEM_SOAT') return 'purple';
    return 'default';
  };

  // Lọc quyền theo tìm kiếm
  const filteredModules = permissionModules.map((m) => ({
    ...m,
    permissions: m.permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(matrixSearch.toLowerCase())
    ),
  })).filter((m) => m.permissions.length > 0);

  if (!canAccess) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
        Bạn không có quyền quản lý nhóm vai trò RBAC.
      </div>
    );
  }

  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm" styles={{ body: { padding: '24px' } }}>
      {/* Header thanh công cụ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <Title level={4} className="!m-0 text-gray-800 flex items-center gap-2">
            <SafetyCertificateOutlined className="text-blue-500" />
            Cấu hình Phân quyền RBAC (Role-Based Access Control)
          </Title>
          <Text type="secondary" className="text-sm">
            Quản lý ma trận phân quyền chi tiết cho từng vai trò trên từng chức năng của hệ thống SCB.
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as any)}
            options={[
              { label: 'Ma trận quyền (Grid)', value: 'matrix', icon: <TableOutlined /> },
              { label: 'Chi tiết vai trò (Inspector)', value: 'inspector', icon: <AppstoreOutlined /> },
            ]}
            className="bg-gray-100 p-1 font-medium"
          />

          <Button icon={<ReloadOutlined />} onClick={fetchRoles}>
            Làm mới
          </Button>

          {canRolesCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateRole}>
              Thêm vai trò mới
            </Button>
          )}
        </div>
      </div>

      {/* Cảnh báo thay đổi chưa lưu (ở chế độ Ma trận) */}
      {dirtyRoleIds.length > 0 && viewMode === 'matrix' && (
        <Alert
          message={
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span>
                Bạn có thay đổi phân quyền chưa lưu trên <strong>{dirtyRoleIds.length}</strong> vai trò. Vui lòng bấm lưu để áp dụng ngay vào hệ thống!
              </span>
              <Space>
                <Button size="small" onClick={() => fetchRoles()}>
                  Hủy thay đổi
                </Button>
                <Button 
                  size="small" 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  loading={savingMatrix}
                  onClick={handleSaveMatrixChanges}
                >
                  Lưu thay đổi ngay
                </Button>
              </Space>
            </div>
          }
          type="warning"
          showIcon
          className="mb-6 shadow-xs border-amber-200 bg-amber-50"
        />
      )}

      {/* ======================================================== */}
      {/* CHẾ ĐỘ 1: BẢNG MA TRẬN PHÂN QUYỀN (MATRIX GRID) */}
      {/* ======================================================== */}
      {viewMode === 'matrix' && (
        <div>
          {/* Thanh tìm kiếm & bộ lọc ma trận */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Tìm kiếm quyền theo tên, mã code hoặc mô tả..."
              allowClear
              value={matrixSearch}
              onChange={(e) => setMatrixSearch(e.target.value)}
              className="max-w-md"
            />
            <Text type="secondary" className="text-xs">
              Mẹo: Nhấp vào ô Checkbox để cấp/thu hồi quyền tức thì. Quản trị viên (ADMIN) mặc định luôn có toàn quyền.
            </Text>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-2xs bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-700">
                  <th className="py-3.5 px-4 font-semibold min-w-[320px] sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                    Danh mục Quyền hạn theo Module
                  </th>
                  {roles.map((r) => {
                    const currentPerms = matrixState[r.id] || [];
                    const allPermsCount = permissionModules.flatMap((m) => m.permissions).length;
                    const isAll = currentPerms.length === allPermsCount;

                    return (
                      <th key={r.id} className="py-3 px-3 font-semibold min-w-[170px] text-center border-r border-gray-100 last:border-r-0">
                        <div className="flex flex-col items-center gap-1">
                          <Tag color={getRoleBadgeColor(r.ma_vai_tro)} className="m-0 font-semibold px-2 py-0.5">
                            {r.ma_vai_tro}
                          </Tag>
                          <span className="text-xs font-medium text-gray-800 line-clamp-1" title={r.ten_vai_tro}>
                            {r.ten_vai_tro}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {r.ma_vai_tro === 'ADMIN' ? 'Toàn quyền' : `${currentPerms.length}/${allPermsCount} quyền`}
                          </span>

                          {r.ma_vai_tro !== 'ADMIN' && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <button
                                type="button"
                                onClick={() => handleToggleAllForRole(r.id, true)}
                                className="text-[10px] text-blue-600 hover:underline"
                              >
                                Tất cả
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                type="button"
                                onClick={() => handleToggleAllForRole(r.id, false)}
                                className="text-[10px] text-gray-500 hover:underline"
                              >
                                Xóa hết
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredModules.map((module) => (
                  <React.Fragment key={module.module}>
                    {/* Hàng phân cách Module */}
                    <tr className="bg-blue-50/40 font-semibold text-blue-900 border-t border-b border-blue-100">
                      <td colSpan={roles.length + 1} className="py-2 px-4 text-xs tracking-wide uppercase">
                        📂 {module.module} - <span className="font-normal text-blue-700/80 normal-case">{module.description}</span>
                      </td>
                    </tr>

                    {/* Danh sách các quyền trong Module */}
                    {module.permissions.map((perm) => (
                      <tr key={perm.code} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 sticky left-0 bg-white hover:bg-gray-50/70 border-r border-gray-200 z-10">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-gray-800 text-xs sm:text-sm">{perm.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <Tag className="text-[10px] px-1 font-mono m-0">{perm.code}</Tag>
                              {perm.isDangerous && (
                                <Tooltip title="Thao tác nhạy cảm, chỉ nên cấp cho cấp Quản lý">
                                  <Tag color="error" className="text-[10px] px-1 m-0">Nguy hiểm</Tag>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">{perm.description}</div>
                        </td>

                        {/* Ô Checkbox cho từng Vai trò */}
                        {roles.map((r) => {
                          const isAdminRole = r.ma_vai_tro === 'ADMIN';
                          const isChecked = isAdminRole || (matrixState[r.id] || []).includes(perm.code);

                          return (
                            <td key={r.id} className="py-3 px-3 text-center border-r border-gray-100 last:border-r-0">
                              <div className="flex justify-center items-center">
                                {isAdminRole ? (
                                  <Tooltip title="Quản trị viên luôn có quyền này">
                                    <CheckCircleOutlined className="text-emerald-500 text-base" />
                                  </Tooltip>
                                ) : (
                                  <Checkbox
                                    disabled={!canRolesUpdate}
                                    checked={isChecked}
                                    onChange={(e) => handleTogglePermInMatrix(r.id, perm.code, e.target.checked)}
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {dirtyRoleIds.length > 0 && (
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <Button onClick={() => fetchRoles()}>Hủy thay đổi</Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                loading={savingMatrix}
                onClick={handleSaveMatrixChanges}
              >
                Lưu ma trận phân quyền
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* CHẾ ĐỘ 2: CHI TIẾT TỪNG VAI TRÒ (MASTER - DETAIL INSPECTOR) */}
      {/* ======================================================== */}
      {viewMode === 'inspector' && selectedRole && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cột trái: Danh sách các Vai trò */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
              Danh sách nhóm vai trò ({roles.length})
            </div>

            {roles.map((r) => {
              const isSelected = r.id === selectedRole.id;
              const permsCount = r.ma_vai_tro === 'ADMIN' ? 'Toàn quyền' : `${(matrixState[r.id] || []).length} quyền`;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-200 shadow-2xs'
                      : 'border-transparent hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Tag color={getRoleBadgeColor(r.ma_vai_tro)} className="m-0 font-semibold text-xs">
                        {r.ma_vai_tro}
                      </Tag>
                      <span className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                        {r.ten_vai_tro}
                      </span>
                    </div>
                    <Badge count={r.userCount} overflowCount={999} style={{ backgroundColor: r.userCount > 0 ? '#108ee9' : '#d9d9d9' }} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1 line-clamp-1">{r.mo_ta || 'Chưa có mô tả chi tiết'}</div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                    <span>Quyền hạn: <strong>{permsCount}</strong></span>
                    <Space size="small">
                      {canRolesUpdate && (
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<EditOutlined />} 
                          onClick={(e) => { e.stopPropagation(); handleOpenEditRole(r); }} 
                        />
                      )}
                      {canRolesDelete && r.ma_vai_tro !== 'ADMIN' && r.userCount === 0 && (
                        <Popconfirm 
                          title="Xóa vai trò này?" 
                          onConfirm={(e) => { e?.stopPropagation(); handleDeleteRole(r.id); }}
                          onPopupClick={(e) => e.stopPropagation()}
                        >
                          <Button 
                            type="text" 
                            danger 
                            size="small" 
                            icon={<DeleteOutlined />} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </Popconfirm>
                      )}
                    </Space>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cột phải: Khung phân quyền chi tiết cho vai trò đang chọn */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
            {/* Header thông tin vai trò */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-5 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <Tag color={getRoleBadgeColor(selectedRole.ma_vai_tro)} className="font-semibold text-sm px-2.5 py-0.5">
                    {selectedRole.ma_vai_tro}
                  </Tag>
                  <Title level={4} className="!m-0 text-gray-800 font-bold">
                    {selectedRole.ten_vai_tro}
                  </Title>
                </div>
                <Text type="secondary" className="text-xs block mt-1">
                  {selectedRole.mo_ta || 'Chưa có thông tin mô tả chi tiết cho vai trò này.'}
                </Text>
              </div>

              {selectedRole.ma_vai_tro !== 'ADMIN' && (
                <Space>
                  <Button size="small" onClick={() => handleToggleAllForRole(selectedRole.id, true)}>
                    Chọn tất cả
                  </Button>
                  <Button size="small" onClick={() => handleToggleAllForRole(selectedRole.id, false)}>
                    Bỏ chọn tất cả
                  </Button>
                </Space>
              )}
            </div>

            {/* Danh sách người dùng đang gán vai trò này */}
            <div className="mb-5 bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
              <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center justify-between">
                <span>👥 Nhân sự đang đảm nhiệm vai trò này ({roleUsers.length}):</span>
              </div>
              {loadingUsers ? (
                <Spin size="small" />
              ) : roleUsers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {roleUsers.map((u) => (
                    <Tag key={u.id} icon={<UserOutlined />} className="px-2 py-1 bg-white border-gray-200">
                      <strong>{u.ho_ten}</strong> ({u.ma_nguoi_dung}) {u.chuc_vu ? `- ${u.chuc_vu}` : ''}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Text type="secondary" className="text-xs">Chưa có người dùng nào được gán vai trò này.</Text>
              )}
            </div>

            {/* Danh sách các quyền theo từng Module */}
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {permissionModules.map((module) => {
                const isAdmin = selectedRole.ma_vai_tro === 'ADMIN';
                const rolePerms = matrixState[selectedRole.id] || [];

                return (
                  <div key={module.module} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="font-semibold text-sm text-gray-800 mb-1 flex items-center justify-between">
                      <span>📂 {module.module}</span>
                      <span className="text-xs font-normal text-gray-400">
                        {module.permissions.filter((p) => isAdmin || rolePerms.includes(p.code)).length} / {module.permissions.length} quyền
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{module.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {module.permissions.map((perm) => {
                        const isChecked = isAdmin || rolePerms.includes(perm.code);

                        return (
                          <div
                            key={perm.code}
                            onClick={() => !isAdmin && handleTogglePermInMatrix(selectedRole.id, perm.code, !isChecked)}
                            className={`p-3 rounded-lg border transition-all ${
                              isChecked
                                ? 'bg-blue-50/50 border-blue-200'
                                : 'bg-gray-50/30 border-gray-100 hover:bg-gray-50'
                            } ${isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-xs text-gray-800">{perm.name}</span>
                                  <Tag className="text-[10px] px-1 font-mono m-0">{perm.code}</Tag>
                                  {perm.isDangerous && <Tag color="error" className="text-[10px] px-1 m-0">Nguy hiểm</Tag>}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-1 leading-tight">{perm.description}</div>
                              </div>
                              <Switch
                                size="small"
                                disabled={isAdmin}
                                checked={isChecked}
                                onChange={(val) => handleTogglePermInMatrix(selectedRole.id, perm.code, val)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nút lưu cho vai trò đang chọn */}
            {selectedRole.ma_vai_tro !== 'ADMIN' && (
              <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                <Button onClick={() => fetchRoles()}>Khôi phục</Button>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  loading={savingMatrix}
                  onClick={handleSaveMatrixChanges}
                >
                  Lưu phân quyền cho {selectedRole.ten_vai_tro}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TẠO / SỬA VAI TRÒ */}
      {/* ======================================================== */}
      <Modal
        title={editingRole ? 'Chỉnh sửa thông tin vai trò' : 'Tạo mới nhóm vai trò'}
        open={isRoleModalOpen}
        onCancel={() => setIsRoleModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleSaveRoleInfo}
          className="pt-2"
        >
          <Form.Item
            name="ma_vai_tro"
            label="Mã vai trò (Mã code viết hoa)"
            rules={[
              { required: true, message: 'Vui lòng nhập mã vai trò' },
              { pattern: /^[A-Z0-9_]+$/, message: 'Mã vai trò chỉ gồm chữ hoa, số và dấu gạch dưới' },
            ]}
          >
            <Input placeholder="VD: CHUYEN_VIEN_QA" disabled={!!editingRole} />
          </Form.Item>

          <Form.Item
            name="ten_vai_tro"
            label="Tên hiển thị vai trò"
            rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
          >
            <Input placeholder="VD: Chuyên viên Đảm bảo chất lượng (QA)" />
          </Form.Item>

          <Form.Item name="mo_ta" label="Mô tả chức năng & quyền hạn">
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết phạm vi trách nhiệm của vai trò này..." />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setIsRoleModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submittingRole}>
              Lưu vai trò
            </Button>
          </div>
        </Form>
      </Modal>
    </Card>
  );
}
