import { Form, Input, Row, Col, Divider } from 'antd';

export default function FormTpbvskTuCongBo() {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'co_so_dung_ten']} label="Cơ sở đứng tên">
            <Input placeholder="Nhập tên cơ sở đứng tên" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'dang_san_pham']} label="Dạng sản phẩm">
            <Input placeholder="Nhập dạng sản phẩm" />
          </Form.Item>
        </Col>
      </Row>

      {/* Tạm thời Form tự công bố không có URL đặc thù ở Database, nhưng để tương thích có thể mở rộng sau. Hiện tại dùng Hồ sơ lưu trữ chung */}
      {/* Nếu DB có ban_tu_cong_bo_url thì sẽ mở comment đoạn này */}
      {/*
      <Divider  plain style={{ margin: '12px 0' }}>Link Tài Liệu Đặc Thù</Divider>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'ban_tu_cong_bo_url']} label="Bản tự công bố" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
            <Input placeholder="Dán link Google Drive hoặc URL file" />
          </Form.Item>
        </Col>
      </Row>
      */}
    </>
  );
}
