import { Form, Input, Row, Col, Divider } from 'antd';
import UploadOrLinkInput from '../../common/UploadOrLinkInput';

export default function FormMyPham() {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'nhan_hang']} label="Nhãn hàng">
            <Input placeholder="Nhập nhãn hàng" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'dang_my_pham']} label="Dạng mỹ phẩm">
            <Input placeholder="Nhập dạng mỹ phẩm" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'hs_thay_the_ghi_chu']} label="Hồ sơ bị thay thế / Ghi chú">
            <Input.TextArea rows={2} placeholder="Nhập thông tin hồ sơ bị thay thế hoặc ghi chú" />
          </Form.Item>
        </Col>
      </Row>

      <Divider  plain style={{ margin: '12px 0' }}>Link Tài Liệu Đặc Thù</Divider>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'phieu_cong_bo_url']} label="Phiếu công bố">
            <UploadOrLinkInput />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'xn_quang_cao_url']} label="Xác nhận Quảng cáo">
            <UploadOrLinkInput />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}
