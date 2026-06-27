import { Table, Tag, Button, Space, message, Modal, Form, InputNumber } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { axiosInstance } from '@/services/api';
import dayjs from 'dayjs';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';

export default function FileAccessManager() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const { canApproveFile } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!canApproveFile) {
      router.push('/');
      return;
    }
    fetchData();
  }, [canApproveFile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/file-access/requests');
      setData(res as unknown as any[]);
    } catch (error) {
      message.error('Lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (values: any) => {
    try {
      await axiosInstance.put(`/file-access/approve/${selectedRecord.id}`, { hours: values.hours });
      message.success('Đã phê duyệt yêu cầu');
      setIsApproveModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('Lỗi khi phê duyệt');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await axiosInstance.put(`/file-access/reject/${id}`);
      message.success('Đã từ chối yêu cầu');
      fetchData();
    } catch (error) {
      message.error('Lỗi khi từ chối');
    }
  };

  const handleViewFile = async (record: any) => {
    // Trưởng phòng có quyền xem tất cả file vì isTruongPhong = true
    // Nên chúng ta dùng endpoint bình thường
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    let url = '';
    
    if (record.file_name) {
      url = `${apiUrl}/upload/files/${record.file_name}`;
    } else if (record.tai_lieu) {
      // Assuming tai_lieu includes duong_dan_url. We need to make sure backend returns it.
      url = `${apiUrl}/upload/files/${record.tai_lieu.ten_tai_lieu}`; // We need to fix this if duong_dan_url is better.
      // Wait, backend file-access.service.ts returned: tai_lieu: { select: { ten_tai_lieu: true } }
      // It doesn't return duong_dan_url.
      // To view the file, Trưởng phòng will trigger GET /upload/files/filename.
      // Since Trưởng phòng is isDangKy, they have direct access to bypass DB checks!
      // I will need to update backend to return duong_dan_url or file_name so frontend can construct the URL.
    }
  };

  const columns = [
    {
      title: 'Người yêu cầu',
      dataIndex: ['nguoi_yeu_cau', 'ho_ten'],
      key: 'nguoi_yeu_cau',
      render: (text: string, record: any) => (
        <div>
          <div><strong>{text}</strong></div>
          <div className="text-xs text-gray-500">{record.nguoi_yeu_cau?.phong_ban}</div>
        </div>
      )
    },
    {
      title: 'Tài liệu',
      key: 'tai_lieu',
      render: (text: string, record: any) => (
        <div>
          <div><strong>{record.tai_lieu?.ten_tai_lieu || record.file_name}</strong></div>
          {record.tai_lieu?.ho_so_chung && (
            <div className="text-xs text-blue-500">{record.tai_lieu.ho_so_chung.ten_san_pham}</div>
          )}
        </div>
      )
    },
    {
      title: 'Lý do xin quyền',
      dataIndex: 'ly_do',
      key: 'ly_do',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'trang_thai',
      render: (text: string, record: any) => {
        if (text === 'PENDING') return <Tag color="warning">Chờ duyệt</Tag>;
        if (text === 'APPROVED') {
          const isExpired = dayjs().isAfter(dayjs(record.ngay_het_han));
          return (
            <div>
              <Tag color={isExpired ? "default" : "success"}>
                {isExpired ? 'Đã hết hạn' : 'Đã duyệt'}
              </Tag>
              {!isExpired && <div className="text-xs mt-1">Hết hạn: {dayjs(record.ngay_het_han).format('DD/MM/YYYY HH:mm')}</div>}
            </div>
          );
        }
        return <Tag color="error">Từ chối</Tag>;
      }
    },
    {
      title: 'Ngày yêu cầu',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (record: any) => (
        <Space>
          <Button 
            type="default" 
            icon={<EyeOutlined />}
            onClick={() => {
              // Construct url based on backend update we will make
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
              let fileUrl = '';
              if (record.file_name) fileUrl = `${apiUrl}/upload/files/${record.file_name}`;
              else if (record.tai_lieu?.duong_dan_url) {
                if (record.tai_lieu.duong_dan_url.startsWith('http')) fileUrl = record.tai_lieu.duong_dan_url;
                else fileUrl = `${apiUrl}${record.tai_lieu.duong_dan_url.startsWith('/') ? '' : '/'}${record.tai_lieu.duong_dan_url}`;
              }
              if (fileUrl) window.open(fileUrl, '_blank');
              else message.error('Không tìm thấy đường dẫn file');
            }}
          >
            Xem
          </Button>
          {record.trang_thai === 'PENDING' && (
            <>
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                onClick={() => {
                  setSelectedRecord(record);
                  setIsApproveModalOpen(true);
                }}
              >
                Duyệt
              </Button>
              <Button 
                danger 
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
      />

      <Modal
        title="Phê duyệt quyền xem tài liệu"
        open={isApproveModalOpen}
        onCancel={() => setIsApproveModalOpen(false)}
        onOk={() => form.submit()}
        okText="Duyệt"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleApprove} initialValues={{ hours: 24 }}>
          <div className="mb-4 text-gray-600">
            Cấp quyền xem tài liệu <strong>{selectedRecord?.tai_lieu?.ten_tai_lieu || selectedRecord?.file_name}</strong> cho <strong>{selectedRecord?.nguoi_yeu_cau?.ho_ten}</strong>.
          </div>
          <Form.Item 
            name="hours" 
            label="Thời gian cấp quyền (Giờ)" 
            rules={[{ required: true, message: 'Vui lòng nhập thời gian' }]}
          >
            <InputNumber min={1} max={720} style={{ width: '100%' }} />
          </Form.Item>
          <div className="text-xs text-gray-500">
            * Sau khoảng thời gian này, quyền xem sẽ tự động thu hồi.
          </div>
        </Form>
      </Modal>
    </div>
  );
}
