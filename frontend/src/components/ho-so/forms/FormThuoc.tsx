import { Form, Input, Row, Col, Divider } from 'antd';

export default function FormThuoc() {
  return (
    <>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'hoat_chat_ham_luong']} label="Hoạt chất - Hàm lượng">
            <Input.TextArea rows={2} placeholder="Nhập hoạt chất và hàm lượng" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'bao_che']} label="Dạng bào chế">
            <Input placeholder="Nhập dạng bào chế" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'quy_cach_dong_goi']} label="Quy cách đóng gói">
            <Input placeholder="Nhập quy cách đóng gói" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'dot_cap_so']} label="Đợt cấp số">
            <Input placeholder="Nhập đợt cấp số" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'gia_han']} label="Gia hạn">
            <Input placeholder="Nhập thông tin gia hạn" />
          </Form.Item>
        </Col>
      </Row>

      <Divider  plain style={{ margin: '12px 0' }}>Link Tài Liệu Đặc Thù</Divider>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'quyet_dinh_cap_sdk_url']} label="Quyết định cấp SĐK" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
            <Input placeholder="Dán link Google Drive hoặc URL file" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'ke_khai_gia_url']} label="Kê khai / Công bố giá" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
            <Input placeholder="Dán link Google Drive hoặc URL file" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'quang_cao_url']} label="Hồ sơ Quảng cáo" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
            <Input placeholder="Dán link Google Drive hoặc URL file" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}
