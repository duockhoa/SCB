'use client';

import { Form, Input, Select, Row, Col, Checkbox, Button, Space, Divider } from 'antd';
import type { FormInstance } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { CustomFieldConfig } from '@/types/ho-so.type';
import { toFieldSnakeKey } from '@/utils/loai-ho-so';

export const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Văn bản ngắn (Text)' },
  { value: 'textarea', label: 'Văn bản nhiều dòng (Textarea)' },
  { value: 'number', label: 'Số (Number)' },
  { value: 'date', label: 'Ngày tháng (Date)' },
  { value: 'select', label: 'Danh sách chọn (Select)' },
  { value: 'file', label: 'Tệp đính kèm / Link (File)' },
];

interface Props {
  form: FormInstance;
  crudMode: 'create' | 'edit';
  existingFields?: CustomFieldConfig[] | null;
  dividerTitle?: string;
  emptyText?: string;
  addButtonText?: string;
  allowFileType?: boolean;
}

export function cleanCustomFieldsPayload(fields?: CustomFieldConfig[]): CustomFieldConfig[] {
  return (fields || []).map((f) => ({
    key: (f.key || '').trim(),
    label: (f.label || '').trim(),
    type: f.type || 'text',
    required: Boolean(f.required),
    placeholder: f.placeholder?.trim() || undefined,
    colSpan: f.colSpan || (f.type === 'textarea' || f.type === 'file' ? 24 : 12),
    ...(f.type === 'select'
      ? { options: (f.options || []).map((o) => o.trim()).filter(Boolean) }
      : {}),
  }));
}

export default function CustomFieldsBuilder({
  form,
  crudMode,
  existingFields,
  dividerTitle = 'Cấu hình trường thông tin đặc thù (tùy chỉnh)',
  emptyText = 'Chưa có trường tùy chỉnh nào. Bấm "Thêm trường thông tin" bên dưới nếu cần nhập dữ liệu riêng.',
  addButtonText = 'Thêm trường thông tin',
  allowFileType = true,
}: Props) {
  const typeOptions = allowFileType
    ? FIELD_TYPE_OPTIONS
    : FIELD_TYPE_OPTIONS.filter((o) => o.value !== 'file');

  return (
    <>
      <Divider plain style={{ margin: '12px 0' }}>
        {dividerTitle}
      </Divider>

      <Form.List name="cau_hinh_truong">
        {(fields, { add, remove, move }) => (
          <div className="space-y-3">
            {fields.length === 0 ? (
              <div className="p-4 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500">
                {emptyText}
              </div>
            ) : (
              fields.map((field, index) => (
                <div
                  key={field.key}
                  className="p-3 bg-gray-50/80 border border-gray-200 rounded-lg relative"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-blue-600">
                      Trường #{index + 1}
                    </span>
                    <Space size="small">
                      {index > 0 && (
                        <Button
                          size="small"
                          type="text"
                          icon={<ArrowUpOutlined />}
                          onClick={() => move(index, index - 1)}
                        />
                      )}
                      {index < fields.length - 1 && (
                        <Button
                          size="small"
                          type="text"
                          icon={<ArrowDownOutlined />}
                          onClick={() => move(index, index + 1)}
                        />
                      )}
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      >
                        Xóa
                      </Button>
                    </Space>
                  </div>

                  <Row gutter={12}>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'label']}
                        label="Tên trường hiển thị"
                        rules={[{ required: true, message: 'Nhập tên trường' }]}
                        className="!mb-2"
                      >
                        <Input
                          placeholder="VD: Số công văn"
                          onChange={(e) => {
                            const currentKey = form.getFieldValue([
                              'cau_hinh_truong',
                              field.name,
                              'key',
                            ]);
                            const wasAuto = form.getFieldValue([
                              'cau_hinh_truong',
                              field.name,
                              '_manualKey',
                            ]);
                            if (!wasAuto && (!currentKey || crudMode === 'create' || !existingFields?.[field.name])) {
                              form.setFieldValue(
                                ['cau_hinh_truong', field.name, 'key'],
                                toFieldSnakeKey(e.target.value),
                              );
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={8}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'key']}
                        label="Mã trường (snake_case)"
                        rules={[
                          { required: true, message: 'Nhập mã trường' },
                          {
                            pattern: /^[a-z][a-z0-9_]*$/,
                            message: 'Bắt đầu bằng chữ thường, gồm a-z, 0-9, _',
                          },
                        ]}
                        className="!mb-2"
                      >
                        <Input
                          placeholder="VD: so_cong_van"
                          onChange={() => {
                            form.setFieldValue(
                              ['cau_hinh_truong', field.name, '_manualKey'],
                              true,
                            );
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={8}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'type']}
                        label="Kiểu dữ liệu"
                        rules={[{ required: true, message: 'Chọn kiểu' }]}
                        className="!mb-2"
                      >
                        <Select options={typeOptions} />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={10}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'placeholder']}
                        label="Gợi ý nhập (Placeholder)"
                        className="!mb-2"
                      >
                        <Input placeholder="VD: Nhập số công văn..." />
                      </Form.Item>
                    </Col>

                    <Col xs={12} sm={7}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'colSpan']}
                        label="Độ rộng"
                        className="!mb-2"
                      >
                        <Select>
                          <Select.Option value={12}>Nửa hàng (1/2)</Select.Option>
                          <Select.Option value={24}>Toàn hàng (1/1)</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={12} sm={7} className="flex items-end pb-2">
                      <Form.Item
                        {...field}
                        name={[field.name, 'required']}
                        valuePropName="checked"
                        className="!mb-0"
                      >
                        <Checkbox>Bắt buộc nhập</Checkbox>
                      </Form.Item>
                    </Col>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, curr) =>
                        prev?.cau_hinh_truong?.[field.name]?.type !==
                        curr?.cau_hinh_truong?.[field.name]?.type
                      }
                    >
                      {({ getFieldValue }) => {
                        const fieldType = getFieldValue([
                          'cau_hinh_truong',
                          field.name,
                          'type',
                        ]);
                        if (fieldType !== 'select') return null;
                        return (
                          <Col span={24}>
                            <Form.Item
                              {...field}
                              name={[field.name, 'options']}
                              label="Các lựa chọn (Nhập từng mục rồi nhấn Enter)"
                              rules={[
                                {
                                  required: true,
                                  message: 'Vui lòng thêm ít nhất 1 lựa chọn',
                                },
                              ]}
                              className="!mb-1"
                            >
                              <Select
                                mode="tags"
                                tokenSeparators={[',']}
                                placeholder="VD: Lựa chọn A, Lựa chọn B..."
                              />
                            </Form.Item>
                          </Col>
                        );
                      }}
                    </Form.Item>
                  </Row>
                </div>
              ))
            )}

            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={() =>
                add({
                  key: '',
                  label: '',
                  type: 'text',
                  required: false,
                  colSpan: 12,
                })
              }
            >
              {addButtonText}
            </Button>
          </div>
        )}
      </Form.List>
    </>
  );
}

