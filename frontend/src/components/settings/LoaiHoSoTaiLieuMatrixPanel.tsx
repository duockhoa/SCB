'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import {
  CheckSquareOutlined,
  CopyOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  SlidersOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  useLoaiHoSoList,
  useNhomTaiLieuList,
  useUpdateLoaiHoSoTaiLieuConfig,
} from '@/hooks/queries/useDanhMuc';
import { usePermissions } from '@/hooks/usePermissions';
import type { LoaiHoSo, LoaiTaiLieu, NhomTaiLieu } from '@/types/ho-so.type';
import { getLoaiHoSoAntdColor } from '@/utils/loai-ho-so';

const { Title, Text } = Typography;

function isEnabledForLoaiHoSo(
  item: { ap_dung_tat_ca?: boolean; loai_ho_so_ids?: number[] },
  loaiHoSoId: number,
): boolean {
  if (item.ap_dung_tat_ca !== false) return true;
  return Array.isArray(item.loai_ho_so_ids) && item.loai_ho_so_ids.includes(loaiHoSoId);
}

function getConfigSetsForLoaiHoSo(groups: NhomTaiLieu[], loaiHoSoId: number) {
  const nhomIds = new Set<number>();
  const loaiIds = new Set<number>();

  for (const g of groups) {
    if (g.trang_thai === false) continue;
    if (isEnabledForLoaiHoSo(g, loaiHoSoId)) {
      nhomIds.add(g.id);
    }
    for (const lt of g.loai_tai_lieu || []) {
      if (lt.trang_thai === false) continue;
      if (isEnabledForLoaiHoSo(lt, loaiHoSoId)) {
        loaiIds.add(lt.id);
      }
    }
  }
  return { nhomIds, loaiIds };
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const val of a) {
    if (!b.has(val)) return false;
  }
  return true;
}

export default function LoaiHoSoTaiLieuMatrixPanel() {
  const { message } = App.useApp();
  const { canDanhMucUpdate } = usePermissions();

  const { data: loaiHoSoRes, isLoading: loadingLoaiHoSo, refetch: refetchLoaiHoSo } = useLoaiHoSoList(true);
  const { data: nhomRes, isLoading: loadingNhom, refetch: refetchNhom } = useNhomTaiLieuList({
    includeInactive: false,
  });

  const loaiHoSoList: LoaiHoSo[] = useMemo(
    () => (Array.isArray(loaiHoSoRes?.data) ? loaiHoSoRes.data : []),
    [loaiHoSoRes?.data],
  );
  const activeGroups: NhomTaiLieu[] = useMemo(
    () => (Array.isArray(nhomRes?.data) ? nhomRes.data : []),
    [nhomRes?.data],
  );

  const { mutateAsync: saveConfig, isPending: saving } = useUpdateLoaiHoSoTaiLieuConfig();

  const [selectedLoaiHoSoId, setSelectedLoaiHoSoId] = useState<number | null>(null);
  const [draftNhomIds, setDraftNhomIds] = useState<Set<number>>(new Set());
  const [draftLoaiIds, setDraftLoaiIds] = useState<Set<number>>(new Set());

  const activeSelectedId = useMemo(() => {
    if (selectedLoaiHoSoId && loaiHoSoList.some((l) => l.id === selectedLoaiHoSoId)) {
      return selectedLoaiHoSoId;
    }
    return loaiHoSoList[0]?.id ?? null;
  }, [selectedLoaiHoSoId, loaiHoSoList]);

  const selectedLoaiHoSo = useMemo(
    () => loaiHoSoList.find((l) => l.id === activeSelectedId) || null,
    [loaiHoSoList, activeSelectedId],
  );

  const serverConfig = useMemo(() => {
    if (!activeSelectedId) return { nhomIds: new Set<number>(), loaiIds: new Set<number>() };
    return getConfigSetsForLoaiHoSo(activeGroups, activeSelectedId);
  }, [activeGroups, activeSelectedId]);

  useEffect(() => {
    setDraftNhomIds(new Set(serverConfig.nhomIds));
    setDraftLoaiIds(new Set(serverConfig.loaiIds));
  }, [serverConfig]);

  const isDirty = useMemo(
    () =>
      !setsEqual(draftNhomIds, serverConfig.nhomIds) ||
      !setsEqual(draftLoaiIds, serverConfig.loaiIds),
    [draftNhomIds, draftLoaiIds, serverConfig],
  );

  const totalActiveTypesCount = useMemo(
    () => activeGroups.reduce((acc, g) => acc + (g.loai_tai_lieu?.length || 0), 0),
    [activeGroups],
  );

  const effectiveSelectedTypesCount = useMemo(() => {
    let count = 0;
    for (const g of activeGroups) {
      if (!draftNhomIds.has(g.id)) continue;
      for (const lt of g.loai_tai_lieu || []) {
        if (draftLoaiIds.has(lt.id)) count++;
      }
    }
    return count;
  }, [activeGroups, draftNhomIds, draftLoaiIds]);

  const handleToggleGroup = (group: NhomTaiLieu, checked: boolean) => {
    setDraftNhomIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(group.id);
      else next.delete(group.id);
      return next;
    });

    // Khi bật lại 1 nhóm chưa có loại nào được tick, mặc định tick các loại đang áp dụng
    if (checked) {
      const types = group.loai_tai_lieu || [];
      const hasAnyChecked = types.some((lt) => draftLoaiIds.has(lt.id));
      if (!hasAnyChecked && types.length > 0) {
        setDraftLoaiIds((prev) => {
          const next = new Set(prev);
          for (const lt of types) next.add(lt.id);
          return next;
        });
      }
    }
  };

  const handleToggleType = (loaiId: number, checked: boolean) => {
    setDraftLoaiIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(loaiId);
      else next.delete(loaiId);
      return next;
    });
  };

  const handleSelectAllInGroup = (group: NhomTaiLieu, selectAll: boolean) => {
    const types = group.loai_tai_lieu || [];
    setDraftLoaiIds((prev) => {
      const next = new Set(prev);
      for (const lt of types) {
        if (selectAll) next.add(lt.id);
        else next.delete(lt.id);
      }
      return next;
    });
  };

  const handleCopyFrom = (sourceLoaiHoSoId: number) => {
    const copied = getConfigSetsForLoaiHoSo(activeGroups, sourceLoaiHoSoId);
    setDraftNhomIds(new Set(copied.nhomIds));
    setDraftLoaiIds(new Set(copied.loaiIds));
    const sourceName = loaiHoSoList.find((l) => l.id === sourceLoaiHoSoId)?.ten_loai || '';
    message.info(`Đã sao chép cấu hình từ "${sourceName}". Nhấn "Lưu cấu hình" để áp dụng.`);
  };

  const handleReset = () => {
    setDraftNhomIds(new Set(serverConfig.nhomIds));
    setDraftLoaiIds(new Set(serverConfig.loaiIds));
  };

  const handleSave = async () => {
    if (!activeSelectedId) return;
    try {
      await saveConfig({
        id: activeSelectedId,
        data: {
          nhom_tai_lieu_ids: [...draftNhomIds],
          loai_tai_lieu_ids: [...draftLoaiIds],
        },
      });
      message.success(`Đã lưu cấu hình tài liệu cho "${selectedLoaiHoSo?.ten_loai}"!`);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
      message.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Lỗi khi lưu cấu hình');
    }
  };

  const handleRefresh = () => {
    refetchLoaiHoSo();
    refetchNhom();
  };

  return (
    <div className="space-y-4">
      <Card
        className="rounded-xl border border-gray-200 shadow-sm"
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <Title level={4} className="!m-0 text-gray-800 flex items-center gap-2">
              <SlidersOutlined className="text-blue-500" />
              Cấu hình Nhóm &amp; Loại tài liệu theo từng Loại hồ sơ
            </Title>
            <Text type="secondary" className="text-sm">
              Chọn từng loại hồ sơ để bật/tắt các nhóm tài liệu hiển thị và chọn chính xác những loại tài liệu cần có trong từng nhóm — tránh hiển thị dư thừa các mục &quot;Chưa tải lên&quot;.
            </Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loadingLoaiHoSo || loadingNhom}>
            Làm mới
          </Button>
        </div>

        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          className="mb-4"
          message="Mỗi loại hồ sơ có thể có bộ nhóm tài liệu và trường tài liệu riêng biệt"
          description="Khi bạn tắt 1 nhóm hoặc bỏ chọn 1 loại tài liệu ở đây, trang chi tiết hồ sơ của loại hồ sơ đó sẽ chỉ hiển thị đúng những nhóm và loại tài liệu đã chọn (các tài liệu đã upload trước đây nếu có vẫn được bảo toàn ở mục Tài liệu khác)."
        />

        {loaiHoSoList.length === 0 ? (
          <Empty description="Chưa có loại hồ sơ nào" />
        ) : (
          <Row gutter={[16, 16]}>
            {/* Cột trái: Danh sách Loại hồ sơ */}
            <Col xs={24} lg={7} xl={6}>
              <div className="border border-slate-200 rounded-xl bg-slate-50/70 p-2.5 space-y-1.5">
                <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Chọn loại hồ sơ ({loaiHoSoList.length})
                </div>
                {loaiHoSoList.map((loai) => {
                  const isSelected = loai.id === activeSelectedId;
                  const cfg = getConfigSetsForLoaiHoSo(activeGroups, loai.id);
                  const activeTypeCount = activeGroups.reduce((sum, g) => {
                    if (!cfg.nhomIds.has(g.id)) return sum;
                    return (
                      sum + (g.loai_tai_lieu || []).filter((lt) => cfg.loaiIds.has(lt.id)).length
                    );
                  }, 0);

                  return (
                    <button
                      key={loai.id}
                      type="button"
                      onClick={() => setSelectedLoaiHoSoId(loai.id)}
                      className={`w-full text-left rounded-lg px-3 py-2.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                          : 'bg-transparent border-transparent hover:bg-white/80 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Tag
                          color={getLoaiHoSoAntdColor(loai.ma_loai, loai.mau_sac)}
                          className="m-0 font-semibold text-xs"
                        >
                          {loai.ten_loai}
                        </Tag>
                        {loai.trang_thai === false && (
                          <Tag color="default" className="m-0 text-[10px]">
                            Ngưng
                          </Tag>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-mono">{loai.ma_loai}</span>
                        <span>
                          {cfg.nhomIds.size} nhóm • {activeTypeCount} loại
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Col>

            {/* Cột phải: Ma trận nhóm & loại tài liệu cho loại hồ sơ đang chọn */}
            <Col xs={24} lg={17} xl={18}>
              {selectedLoaiHoSo && (
                <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag
                          color={getLoaiHoSoAntdColor(
                            selectedLoaiHoSo.ma_loai,
                            selectedLoaiHoSo.mau_sac,
                          )}
                          className="m-0 text-sm font-semibold px-2.5 py-0.5"
                        >
                          {selectedLoaiHoSo.ten_loai}
                        </Tag>
                        <Text type="secondary" className="text-xs font-mono">
                          ({selectedLoaiHoSo.ma_loai})
                        </Text>
                        {isDirty && (
                          <Tag color="warning" className="m-0 text-xs">
                            Chưa lưu thay đổi
                          </Tag>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Đang bật <strong>{draftNhomIds.size}</strong>/{activeGroups.length} nhóm tài liệu
                        {' • '}
                        <strong>{effectiveSelectedTypesCount}</strong>/{totalActiveTypesCount} loại tài liệu hiển thị
                      </div>
                    </div>

                    <Space wrap size="small">
                      <Select
                        placeholder={
                          <span className="inline-flex items-center gap-1">
                            <CopyOutlined /> Sao chép từ loại khác...
                          </span>
                        }
                        style={{ minWidth: 210 }}
                        size="middle"
                        value={null}
                        disabled={!canDanhMucUpdate}
                        onChange={(val: number) => handleCopyFrom(val)}
                        options={loaiHoSoList
                          .filter((item) => item.id !== selectedLoaiHoSo.id)
                          .map((item) => ({
                            value: item.id,
                            label: item.ten_loai,
                          }))}
                      />
                      {isDirty && (
                        <Button icon={<UndoOutlined />} onClick={handleReset} disabled={saving}>
                          Khôi phục
                        </Button>
                      )}
                      {canDanhMucUpdate && (
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          loading={saving}
                          disabled={!isDirty}
                          onClick={handleSave}
                        >
                          Lưu cấu hình
                        </Button>
                      )}
                    </Space>
                  </div>

                  {activeGroups.length === 0 ? (
                    <Empty description="Chưa có nhóm tài liệu nào đang hoạt động" />
                  ) : (
                    <div className="space-y-3">
                      {activeGroups.map((group) => {
                        const groupEnabled = draftNhomIds.has(group.id);
                        const typesInGroup: LoaiTaiLieu[] = (group.loai_tai_lieu || []).filter(
                          (lt) => lt.trang_thai !== false,
                        );
                        const selectedInGroupCount = typesInGroup.filter((lt) =>
                          draftLoaiIds.has(lt.id),
                        ).length;
                        const allSelected =
                          typesInGroup.length > 0 && selectedInGroupCount === typesInGroup.length;

                        return (
                          <div
                            key={group.id}
                            className={`rounded-xl border p-3.5 transition-colors ${
                              groupEnabled
                                ? 'border-slate-200 bg-white'
                                : 'border-dashed border-slate-200 bg-slate-50/70 opacity-75'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <Switch
                                  checked={groupEnabled}
                                  disabled={!canDanhMucUpdate}
                                  onChange={(checked) => handleToggleGroup(group, checked)}
                                  className="mt-0.5 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <FolderOpenOutlined className="text-slate-400" />
                                    <Tag
                                      color={getLoaiHoSoAntdColor(group.ma_nhom, group.mau_sac)}
                                      className="m-0 font-semibold text-xs px-2 py-0.5"
                                    >
                                      {group.ten_nhom}
                                    </Tag>
                                    <Badge
                                      count={`${selectedInGroupCount}/${typesInGroup.length}`}
                                      color={groupEnabled && selectedInGroupCount > 0 ? '#1677ff' : '#94a3b8'}
                                      style={{ boxShadow: 'none' }}
                                    />
                                  </div>
                                  {group.mo_ta && (
                                    <div className="text-xs text-slate-400 mt-1">{group.mo_ta}</div>
                                  )}
                                </div>
                              </div>

                              {groupEnabled && typesInGroup.length > 0 && canDanhMucUpdate && (
                                <Button
                                  size="small"
                                  type="link"
                                  icon={<CheckSquareOutlined />}
                                  onClick={() => handleSelectAllInGroup(group, !allSelected)}
                                  className="!px-1 self-start sm:self-center shrink-0"
                                >
                                  {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </Button>
                              )}
                            </div>

                            {!groupEnabled ? (
                              <div className="text-xs text-slate-400 italic mt-2 pl-11">
                                Nhóm tài liệu này đang ẩn đối với &quot;{selectedLoaiHoSo.ten_loai}&quot;.
                              </div>
                            ) : typesInGroup.length === 0 ? (
                              <div className="text-xs text-slate-400 italic mt-2 pl-11">
                                Nhóm này chưa có loại tài liệu nào. Hãy thêm loại tài liệu ở tab &quot;Nhóm &amp; Loại tài liệu&quot;.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 mt-3 pl-0 sm:pl-11">
                                {typesInGroup.map((loai) => {
                                  const checked = draftLoaiIds.has(loai.id);
                                  return (
                                    <label
                                      key={loai.id}
                                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                        checked
                                          ? 'border-blue-300 bg-blue-50/40'
                                          : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Checkbox
                                        checked={checked}
                                        disabled={!canDanhMucUpdate}
                                        onChange={(e) => handleToggleType(loai.id, e.target.checked)}
                                        className="mt-0.5"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <FileTextOutlined className="text-slate-400 text-xs" />
                                          <span className="text-xs font-semibold text-slate-800 break-words">
                                            {loai.ten_loai_tai_lieu}
                                          </span>
                                        </div>
                                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                          {loai.ma_loai_tai_lieu}
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );
}

