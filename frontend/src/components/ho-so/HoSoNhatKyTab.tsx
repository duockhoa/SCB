import { Table, Empty, Tag } from 'antd';
import dayjs from 'dayjs';

interface Props {
  nhatKyData?: any[];
}

export default function HoSoNhatKyTab({ nhatKyData }: Props) {
  if (!nhatKyData || nhatKyData.length === 0) {
    return <Empty description="Chưa có nhật ký thao tác" />;
  }

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm:ss'),
      width: 180,
    },
    {
      title: 'Hành động',
      dataIndex: 'hanh_dong',
      key: 'hanh_dong',
      render: (text: string) => {
        let color = 'default';
        if (text === 'CREATE') color = 'green';
        if (text === 'UPDATE') color = 'blue';
        if (text === 'CAP_SO') color = 'cyan';
        if (text === 'GIA_HAN') color = 'purple';
        if (text === 'THAY_THE') color = 'orange';
        return <Tag color={color}>{text}</Tag>;
      },
      width: 120,
    },
    {
      title: 'Nội dung thao tác',
      dataIndex: 'noi_dung',
      key: 'noi_dung',
    },
    {
      title: 'Người thực hiện',
      dataIndex: ['nguoi_thuc_hien', 'ho_ten'],
      key: 'nguoi_thuc_hien',
      render: (text: string) => text || 'Hệ thống',
      width: 150,
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={nhatKyData} 
      rowKey="id" 
      pagination={{ pageSize: 10 }} 
    />
  );
}
