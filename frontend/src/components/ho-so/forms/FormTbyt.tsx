import { Form, Input, Row, Col, Select, Divider } from 'antd';

export default function FormTbyt() {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'ten_tbyt_chung_loai']} label="Tên TBYT / Chủng loại">
            <Input placeholder="Nhập tên TBYT hoặc chủng loại" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['thong_tin_rieng', 'phan_loai']} label="Phân loại">
            <Select placeholder="Chọn phân loại">
              <Select.Option value="A">Loại A</Select.Option>
              <Select.Option value="B">Loại B</Select.Option>
              <Select.Option value="C">Loại C</Select.Option>
              <Select.Option value="D">Loại D</Select.Option>
            </Select>
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
          <Form.Item name={['thong_tin_rieng', 'phieu_tiep_nhan_url']} label="Phiếu tiếp nhận" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
            <Input placeholder="Dán link Google Drive hoặc URL file" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'tai_lieu_mo_ta_kt_url']} label="Tài liệu Mô tả Kỹ thuật" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
            <Input placeholder="Dán link Google Drive hoặc URL file" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'tieu_chuan_co_so_url']} label="Tiêu chuẩn Cơ sở" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
            <Input placeholder="Dán link Google Drive hoặc URL file" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'nhan_url']} label="Mẫu nhãn" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
            <Input placeholder="Dán link Google Drive hoặc URL file" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name={['thong_tin_rieng', 'hdsd_url']} label="Hướng dẫn sử dụng" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
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
