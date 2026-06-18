import { Form, Input, Row, Col, Select, Divider } from 'antd';
import UploadOrLinkInput from '../../common/UploadOrLinkInput';

export default function FormCfsCpp() {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'loai_hinh']} label="Loại hình">
            <Select placeholder="Chọn loại hình">
              <Select.Option value="CPP">CPP</Select.Option>
              <Select.Option value="CFS">CFS</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'nuoc_xuat_khau']} label="Nước xuất khẩu">
            <Input placeholder="Nhập nước xuất khẩu" />
          </Form.Item>
        </Col>
      </Row>

      <Divider  plain style={{ margin: '12px 0' }}>Link Tài Liệu Đặc Thù</Divider>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'cong_van_cap_url']} label="Công văn cấp">
            <UploadOrLinkInput />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}
