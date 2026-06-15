import { Table, Button, Space, Tag, Empty } from 'antd';
import { EyeOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { HoSoChung } from '@/types/ho-so.type';

interface Props {
  hoSo: HoSoChung;
  thongTinRieng: any;
}

export default function HoSoTaiLieuTab({ hoSo, thongTinRieng }: Props) {
  // Lấy các link từ dữ liệu
  const buildTaiLieuData = () => {
    let data: any[] = [];
    let idCounter = 1;

    // 1. Hồ sơ lưu trữ chung
    if (hoSo.ho_so_luu_url) {
      data.push({
        id: idCounter++,
        ten_tai_lieu: 'Thư mục Hồ sơ lưu trữ',
        nhom_tai_lieu: 'Tài liệu chung',
        url: hoSo.ho_so_luu_url,
      });
    }

    if (!thongTinRieng) return data;

    // 2. Mapping các trường _url đặc thù thành mảng
    const urlMapping: Record<string, string> = {
      // Thuốc
      quyet_dinh_cap_sdk_url: 'Quyết định cấp SĐK',
      ke_khai_gia_url: 'Kê khai/Công bố Giá',
      quang_cao_url: 'Hồ sơ Quảng cáo',
      
      // Mỹ phẩm & TPBVSK
      phieu_cong_bo_url: 'Phiếu công bố',
      xn_quang_cao_url: 'Xác nhận Quảng cáo',
      ban_tu_cong_bo_url: 'Bản tự công bố',
      nhan_san_pham_url: 'Nhãn sản phẩm',
      
      // TBYT
      phieu_tiep_nhan_url: 'Phiếu tiếp nhận',
      tai_lieu_mo_ta_kt_url: 'Tài liệu mô tả kỹ thuật',
      tieu_chuan_co_so_url: 'Tiêu chuẩn cơ sở',
      nhan_url: 'Mẫu nhãn',
      hdsd_url: 'Hướng dẫn sử dụng',
      
      // CFS/CPP
      cong_van_cap_url: 'Công văn cấp',
    };

    // Duyệt qua thongTinRieng để tìm các key _url
    Object.keys(thongTinRieng).forEach(key => {
      if (key.endsWith('_url') && thongTinRieng[key]) {
        data.push({
          id: idCounter++,
          ten_tai_lieu: urlMapping[key] || key,
          nhom_tai_lieu: 'Tài liệu đặc thù',
          url: thongTinRieng[key],
        });
      }
    });

    return data;
  };

  const dataSource = buildTaiLieuData();

  if (dataSource.length === 0) {
    return <Empty description="Hồ sơ chưa có link tài liệu đính kèm" />;
  }

  const columns = [
    {
      title: 'Tên tài liệu',
      dataIndex: 'ten_tai_lieu',
      key: 'ten_tai_lieu',
      render: (text: string, record: any) => (
        <a href={record.url} target="_blank" rel="noopener noreferrer">
          {record.nhom_tai_lieu === 'Tài liệu chung' ? <FolderOpenOutlined style={{ marginRight: 8 }} /> : null}
          {text}
        </a>
      ),
    },
    {
      title: 'Nhóm tài liệu',
      dataIndex: 'nhom_tai_lieu',
      key: 'nhom_tai_lieu',
      render: (text: string) => <Tag color={text === 'Tài liệu chung' ? 'blue' : 'green'}>{text}</Tag>,
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
            onClick={() => window.open(record.url, '_blank')}
          >
            Mở xem file
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table 
        columns={columns} 
        dataSource={dataSource} 
        rowKey="id" 
        pagination={false} 
      />
    </div>
  );
}
