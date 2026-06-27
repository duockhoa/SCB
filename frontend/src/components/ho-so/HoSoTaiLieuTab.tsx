import { Table, Button, Space, Tag, Empty, Upload, message, Tooltip, Modal, Form, Input, Popconfirm } from 'antd';
import { EyeOutlined, FolderOpenOutlined, UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { HoSoChung } from '@/types/ho-so.type';
import { uploadFile } from '@/services/api';
import { useUpdateHoSo, useAddTaiLieu, useDeleteTaiLieu } from '@/hooks/queries/useHoSo';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import UploadOrLinkInput from '../common/UploadOrLinkInput';
import { axiosInstance, requestFileAccess } from '@/services/api';
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
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestingRecord, setRequestingRecord] = useState<any>(null);
  const [viewingRecordId, setViewingRecordId] = useState<number | null>(null);
  
  const [form] = Form.useForm();
  const [formRequest] = Form.useForm();
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
          ghi_chu: tl.ghi_chu
        });
      });
    }

    return data;
  };

  const dataSource = buildTaiLieuData();

  const handleUploadReplace = async (file: File, record: any) => {
    if (record.is_dynamic) return false;
    setUploadingId(record.id);
    try {
      const response = await uploadFile(file);
      if (response && response.url) {
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
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi tải file lên');
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
    if (!record.url || !record.url.startsWith(apiUrl)) {
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
      if (error.response?.status === 403) {
        setRequestingRecord(record);
        setIsRequestModalOpen(true);
      } else {
        message.error('Lỗi khi mở tài liệu hoặc bạn chưa được cấp quyền');
      }
    } finally {
      setViewingRecordId(null);
    }
  };

  const handleRequestAccess = async (values: any) => {
    if (!requestingRecord) return;
    try {
      let fileName = null;
      let taiLieuId = null;
      if (requestingRecord.is_dynamic) {
         taiLieuId = requestingRecord.real_id;
      } else {
         fileName = requestingRecord.url.split('/').pop();
      }

      await requestFileAccess(taiLieuId, fileName, values.ly_do);
      message.success('Đã gửi yêu cầu cấp quyền xem tài liệu. Vui lòng chờ phê duyệt.');
      setIsRequestModalOpen(false);
      formRequest.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi gửi yêu cầu');
    }
  };

  const columns = [
    {
      title: 'Tên tài liệu',
      dataIndex: 'ten_tai_lieu',
      key: 'ten_tai_lieu',
      render: (text: string, record: any) => (
        <Space direction="vertical" size="small">
          <a onClick={() => handleViewFile(record)}>
            {record.nhom_tai_lieu === 'Tài liệu chung' ? <FolderOpenOutlined style={{ marginRight: 8 }} /> : null}
            {text}
          </a>
          {record.ghi_chu && <span style={{ fontSize: '12px', color: '#888' }}>({record.ghi_chu})</span>}
        </Space>
      ),
    },
    {
      title: 'Nhóm tài liệu',
      dataIndex: 'nhom_tai_lieu',
      key: 'nhom_tai_lieu',
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
      render: (record: any) => (
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
          {canUpdate && !record.is_dynamic && (
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
            <Popconfirm title="Bạn có chắc chắn muốn xóa tài liệu này?" onConfirm={() => handleDeleteDocument(record)}>
              <Button danger icon={<DeleteOutlined />}>Xóa</Button>
            </Popconfirm>
          )}
        </Space>
      ),
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

      {/* Modal xin quyền xem tài liệu */}
      <Modal
        title="Yêu cầu quyền truy cập tài liệu"
        open={isRequestModalOpen}
        onCancel={() => { setIsRequestModalOpen(false); formRequest.resetFields(); }}
        onOk={() => formRequest.submit()}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 16 }}>
          Bạn không có quyền truy cập file <strong>{requestingRecord?.ten_tai_lieu}</strong>.
          Vui lòng điền lý do xin quyền để Trưởng phòng phê duyệt.
        </div>
        <Form form={formRequest} layout="vertical" onFinish={handleRequestAccess}>
          <Form.Item name="ly_do" label="Lý do cần xem tài liệu" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
            <Input.TextArea rows={4} placeholder="Ví dụ: Tôi cần xem file để kiểm tra lại thông tin hồ sơ..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
