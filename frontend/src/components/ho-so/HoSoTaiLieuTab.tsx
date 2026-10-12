import { Table, Button, Space, Tag, Empty, Upload, message, Tooltip, Modal, Form, Input, Popconfirm } from 'antd';
import { EyeOutlined, FolderOpenOutlined, UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { HoSoChung } from '@/types/ho-so.type';
import { uploadFile } from '@/services/api';
import { useUpdateHoSo, useAddTaiLieu, useDeleteTaiLieu } from '@/hooks/queries/useHoSo';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import UploadOrLinkInput from '../common/UploadOrLinkInput';
import { axiosInstance } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

interface Props {
  hoSo: HoSoChung;
  thongTinRieng: any;
}

export default function HoSoTaiLieuTab({ hoSo, thongTinRieng }: Props) {
  const { mutate: updateHoSo } = useUpdateHoSo();
  const { mutate: addTaiLieu, isPending: addingTaiLieu } = useAddTaiLieu();
  const { mutate: deleteTaiLieu } = useDeleteTaiLieu();
  const { canUpdate, canDelete } = usePermissions();
  
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingRecordId, setViewingRecordId] = useState<number | null>(null);
  
  const [form] = Form.useForm();
  const [uploadingNew, setUploadingNew] = useState(false);

  // Lấy các link từ dữ liệu
  const buildTaiLieuData = () => {
    let data: any[] = [];
    let idCounter = 1;

    const getFullUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      // Đảm bảo có đúng 1 dấu gạch chéo giữa baseUrl và url
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const cleanUrl = url.startsWith('/') ? url : `/${url}`;
      
      return `${cleanBase}${cleanUrl}`;
    };

    if (hoSo.ho_so_luu_url) {
      data.push({
        id: idCounter++,
        ten_tai_lieu: 'Thư mục Hồ sơ lưu trữ',
        nhom_tai_lieu: 'Tài liệu chung',
        url: getFullUrl(hoSo.ho_so_luu_url),
        field_key: 'ho_so_luu_url',
        is_dynamic: false
      });
    }

    if (thongTinRieng) {
      // Mapping các trường _url đặc thù thành mảng
      const urlMapping: Record<string, string> = {
        quyet_dinh_cap_sdk_url: 'Quyết định cấp SĐK',
        ke_khai_gia_url: 'Kê khai/Công bố Giá',
        quang_cao_url: 'Hồ sơ Quảng cáo',
        phieu_cong_bo_url: 'Phiếu công bố',
        xn_quang_cao_url: 'Xác nhận Quảng cáo',
        ban_tu_cong_bo_url: 'Bản tự công bố',
        nhan_san_pham_url: 'Nhãn sản phẩm',
        phieu_tiep_nhan_url: 'Phiếu tiếp nhận',
        tai_lieu_mo_ta_kt_url: 'Tài liệu mô tả kỹ thuật',
        tieu_chuan_co_so_url: 'Tiêu chuẩn cơ sở',
        nhan_url: 'Mẫu nhãn',
        hdsd_url: 'Hướng dẫn sử dụng',
        cong_van_cap_url: 'Công văn cấp',
      };

      Object.keys(thongTinRieng).forEach(key => {
        if (key.endsWith('_url') && thongTinRieng[key]) {
          data.push({
            id: idCounter++,
            ten_tai_lieu: urlMapping[key] || key,
            nhom_tai_lieu: 'Tài liệu đặc thù',
            url: getFullUrl(thongTinRieng[key]),
            field_key: key,
            is_dynamic: false
          });
        }
      });
    }

    // Các tài liệu khác tải thêm từ bảng tai_lieu_ho_so
    if (hoSo.tai_lieu && hoSo.tai_lieu.length > 0) {
      hoSo.tai_lieu.forEach((tl: any) => {
        data.push({
          id: tl.id,
          real_id: tl.id, // DB id
          ten_tai_lieu: tl.ten_tai_lieu,
          nhom_tai_lieu: 'Tài liệu khác',
          url: getFullUrl(tl.duong_dan_url),
          is_dynamic: true,
          ghi_chu: tl.ghi_chu,
          so_phien_ban: tl.so_phien_ban || 1,
          tai_lieu_hien_hanh: tl.tai_lieu_hien_hanh !== false,
          ngay_tai_len: tl.ngay_tai_len,
          ngay_hieu_luc: tl.ngay_hieu_luc,
          ngay_het_hieu_luc: tl.ngay_het_hieu_luc,
        });
      });
    }

    return data;
  };

  const dataSource = buildTaiLieuData();

  const handleUploadReplace = async (file: File, record: any) => {
    setUploadingId(record.id);
    try {
      const response = await uploadFile(file);
      if (response && response.url) {
        if (record.is_dynamic) {
          // Upload thay thế tài liệu khác: đánh dấu bản cũ hết hiệu lực và tạo bản mới với version tăng
          await axiosInstance.post(`/ho-so/${hoSo.id}/tai-lieu/${record.real_id}/thay-the`, {
            duong_dan_url: response.url,
            ten_tai_lieu: record.ten_tai_lieu,
            ghi_chu: `Bản thay thế cho phiên bản v${record.so_phien_ban || 1}`,
          });
          message.success(`Đã thay thế tài liệu thành công (Tạo phiên bản v${(record.so_phien_ban || 1) + 1}, bản cũ đã đánh dấu hết hiệu lực)!`);
          queryClient.invalidateQueries({ queryKey: ['HOSO_DETAIL'] });
        } else {
          // Tài liệu chung hoặc tài liệu đặc thù
          let updateData: any = {};
          if (record.nhom_tai_lieu === 'Tài liệu chung') {
            updateData[record.field_key] = response.url;
          } else {
            updateData['thong_tin_rieng'] = {
              ...thongTinRieng,
              [record.field_key]: response.url
            };
          }

          updateHoSo({ id: hoSo.id, data: updateData }, {
            onSuccess: () => {
              message.success('Tải và thay thế file thành công!');
              queryClient.invalidateQueries({ queryKey: ['HOSO_DETAIL'] });
            },
            onError: () => {
              message.error('Lỗi khi cập nhật hồ sơ');
            }
          });
        }
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Lỗi khi tải file lên thay thế');
    } finally {
      setUploadingId(null);
    }
    return false; // Prevent default upload behavior
  };

  const handleAddNewDocument = async (values: any) => {
    if (!values.duong_dan_url) {
      message.error('Vui lòng cung cấp link hoặc file');
      return;
    }
    setUploadingNew(true);
    try {
      addTaiLieu({
        id: hoSo.id,
        data: {
          ten_tai_lieu: values.ten_tai_lieu,
          duong_dan_url: values.duong_dan_url,
          ghi_chu: values.ghi_chu
        }
      }, {
        onSuccess: () => {
          message.success('Tải thêm tài liệu thành công!');
          setIsAddModalOpen(false);
          form.resetFields();
        },
        onError: () => {
          message.error('Lỗi khi thêm tài liệu');
        }
      });
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi thêm tài liệu');
    } finally {
      setUploadingNew(false);
    }
  };

  const handleDeleteDocument = (record: any) => {
    deleteTaiLieu({ id: hoSo.id, taiLieuId: record.real_id }, {
      onSuccess: () => message.success('Xóa tài liệu thành công'),
      onError: () => message.error('Lỗi khi xóa tài liệu')
    });
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const handleViewFile = async (record: any) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // Nếu là link ngoài (bắt đầu bằng http) và KHÔNG thuộc API của mình -> mở tab mới trực tiếp
    if (record.url && record.url.startsWith('http') && !record.url.startsWith(apiUrl)) {
      window.open(record.url, '_blank');
      return;
    }

    setViewingRecordId(record.id);
    try {
      const response = await axiosInstance.get(record.url, {
        responseType: 'blob',
      });
      const fileUrl = window.URL.createObjectURL(response as unknown as Blob);
      window.open(fileUrl, '_blank');
    } catch (error: any) {
      message.error('Lỗi khi mở tài liệu hoặc file không tồn tại');
    } finally {
      setViewingRecordId(null);
    }
  };

  const columns = [
    {
      title: 'Tên tài liệu',
      dataIndex: 'ten_tai_lieu',
      key: 'ten_tai_lieu',
      render: (text: string, record: any) => {
        const isExpired = record.is_dynamic && record.tai_lieu_hien_hanh === false;
        return (
          <Space direction="vertical" size={2}>
            <div className="flex items-center gap-2 flex-wrap">
              <a 
                onClick={() => handleViewFile(record)}
                className={`font-medium ${isExpired ? 'text-gray-400 line-through' : 'text-blue-600 hover:underline'}`}
              >
                {record.nhom_tai_lieu === 'Tài liệu chung' ? <FolderOpenOutlined className="mr-1" /> : null}
                {text}
              </a>
              {record.is_dynamic && (
                record.tai_lieu_hien_hanh ? (
                  <Tag color="success" className="text-xs">
                    Hiệu lực (v{record.so_phien_ban})
                  </Tag>
                ) : (
                  <Tag color="default" className="text-xs bg-gray-100 text-gray-500 border-gray-300">
                    Hết hiệu lực (v{record.so_phien_ban})
                  </Tag>
                )
              )}
            </div>
            {record.ghi_chu && (
              <span className="text-xs text-gray-400 italic">
                {record.ghi_chu}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Nhóm tài liệu',
      dataIndex: 'nhom_tai_lieu',
      key: 'nhom_tai_lieu',
      width: 150,
      render: (text: string) => {
        let color = 'default';
        if (text === 'Tài liệu chung') color = 'blue';
        else if (text === 'Tài liệu đặc thù') color = 'green';
        else if (text === 'Tài liệu khác') color = 'purple';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 250,
      render: (record: any) => {
        const isExpired = record.is_dynamic && record.tai_lieu_hien_hanh === false;

        return (
          <Space size="middle">
            <Button 
              type="primary" 
              ghost
              icon={<EyeOutlined />} 
              onClick={() => handleViewFile(record)}
              loading={viewingRecordId === record.id}
            >
              Mở xem
            </Button>
            {canUpdate && !isExpired && (
              <Upload 
                showUploadList={false}
                beforeUpload={(file) => handleUploadReplace(file, record)}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  loading={uploadingId === record.id}
                >
                  Upload thay thế
                </Button>
              </Upload>
            )}
            {canDelete && record.is_dynamic && (
              <Popconfirm 
                title={isExpired ? "Xóa bản lưu lịch sử này?" : "Bạn có chắc chắn muốn xóa tài liệu này?"} 
                onConfirm={() => handleDeleteDocument(record)}
              >
                <Button danger icon={<DeleteOutlined />}>Xóa</Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Danh sách tài liệu đính kèm</h3>
        {canUpdate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
            Thêm tài liệu khác
          </Button>
        )}
      </div>

      {dataSource.length === 0 ? (
        <Empty description="Hồ sơ chưa có link tài liệu đính kèm" />
      ) : (
        <Table 
          columns={columns} 
          dataSource={dataSource} 
          rowKey="id" 
          pagination={false} 
        />
      )}

      <Modal
        title="Thêm tài liệu khác"
        open={isAddModalOpen}
        onCancel={() => { setIsAddModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={uploadingNew || addingTaiLieu}
        okText="Tải lên"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleAddNewDocument}>
          <Form.Item name="ten_tai_lieu" label="Tên tài liệu" rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu' }]}>
            <Input placeholder="Nhập tên tài liệu..." />
          </Form.Item>
          <Form.Item name="ghi_chu" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú thêm nếu có..." />
          </Form.Item>
          <Form.Item name="duong_dan_url" label="Link / File đính kèm" rules={[{ required: true, message: 'Vui lòng cung cấp link hoặc file' }]}>
            <UploadOrLinkInput placeholder="Dán link hoặc tải file lên..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
