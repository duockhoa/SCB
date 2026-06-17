import { Form, Input, Row, Col, Divider } from 'antd';

export default function FormTpbvskCongBo() {
  return (
    <>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'thanh_phan']} label="Thành phần">
            <Input.TextArea rows={3} placeholder="Nhập thành phần" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'chu_so_huu']} label="Chủ sở hữu">
            <Input placeholder="Nhập tên chủ sở hữu" />
          </Form.Item>
        </Col>
      </Row>

      <Divider  plain style={{ margin: '12px 0' }}>Link Tài Liệu Đặc Thù</Divider>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'phieu_cong_bo_url']} label="Phiếu công bố" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
            <Input placeholder="Dán link Google Drive hoặc URL file" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'xn_quang_cao_url']} label="Xác nhận Quảng cáo" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
            <Input placeholder="Dán link Google Drive hoặc URL file" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}
