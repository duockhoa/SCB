'use client';

import { Form, Input, InputNumber, DatePicker, Select, Row, Col, Divider } from 'antd';
import type { CustomFieldConfig } from '@/types/ho-so.type';
import UploadOrLinkInput from '../../common/UploadOrLinkInput';

interface Props {
  fields: CustomFieldConfig[];
  fieldPrefix?: string;
  showFileDivider?: boolean;
  fileDividerTitle?: string;
}

export default function DynamicFieldsForm({
  fields,
  fieldPrefix = 'thong_tin_rieng',
  showFileDivider = true,
  fileDividerTitle = 'Link Tài Liệu Đặc Thù',
}: Props) {
  if (!fields || fields.length === 0) return null;

  const regularFields = fields.filter((f) => f.type !== 'file');
  const fileFields = fields.filter((f) => f.type === 'file');

  const renderControl = (field: CustomFieldConfig) => {
    const placeholder = field.placeholder || `Nhập ${field.label.toLowerCase()}`;
    switch (field.type) {
      case 'textarea':
        return <Input.TextArea rows={3} placeholder={placeholder} />;
      case 'number':
        return <InputNumber className="w-full" placeholder={placeholder} />;
      case 'date':
        return <DatePicker className="w-full" format="DD/MM/YYYY" placeholder={field.placeholder || 'Chọn ngày'} />;
      case 'select':
        return (
          <Select placeholder={field.placeholder || `Chọn ${field.label.toLowerCase()}`} allowClear>
            {(field.options || []).map((opt) => (
              <Select.Option key={opt} value={opt}>
                {opt}
              </Select.Option>
            ))}
          </Select>
        );
      case 'file':
        return <UploadOrLinkInput placeholder={field.placeholder || 'Dán link hoặc tải file lên...'} />;
      case 'text':
      default:
        return <Input placeholder={placeholder} />;
    }
  };

  const renderFieldList = (list: CustomFieldConfig[]) => (
    <Row gutter={16}>
      {list.map((field) => {
        const desktopSpan = field.colSpan || (field.type === 'textarea' || field.type === 'file' ? 24 : 12);
        return (
          <Col xs={24} sm={desktopSpan} key={field.key}>
            <Form.Item
              name={[fieldPrefix, field.key]}
              label={field.label}
              rules={field.required ? [{ required: true, message: `Vui lòng nhập ${field.label}` }] : undefined}
            >
              {renderControl(field)}
            </Form.Item>
          </Col>
        );
      })}
    </Row>
  );

  return (
    <>
      {regularFields.length > 0 && renderFieldList(regularFields)}
      {fileFields.length > 0 && (
        <>
          {showFileDivider && (
            <Divider plain style={{ margin: '12px 0' }}>
              {fileDividerTitle}
            </Divider>
          )}
          {renderFieldList(fileFields)}
        </>
      )}
    </>
  );
}

