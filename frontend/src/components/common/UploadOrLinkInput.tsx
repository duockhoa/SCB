import React, { useState } from 'react';
import { Input, Button, Upload, message, Tooltip, Space } from 'antd';
import { UploadOutlined, LinkOutlined, FileOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { uploadFile } from '@/services/api';

interface UploadOrLinkInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const UploadOrLinkInput: React.FC<UploadOrLinkInputProps> = ({ value, onChange, placeholder }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      // Gọi service API để upload file
      const response = await uploadFile(file as File);
      
      // Thành công: cập nhật value của Form.Item
      if (response && response.url) {
        if (onChange) {
          onChange(response.url);
        }
        message.success('Tải file lên thành công!');
        onSuccess?.(response, new XMLHttpRequest());
      } else {
        throw new Error('Không nhận được đường dẫn file');
      }
    } catch (error: any) {
      console.error('Lỗi khi tải file:', error);
      message.error(error.message || 'Lỗi khi tải file lên');
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    customRequest: handleUpload,
    showUploadList: false,
    maxCount: 1,
    beforeUpload: (file) => {
      // Giới hạn 10MB
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File phải nhỏ hơn 10MB!');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        prefix={<LinkOutlined className="text-gray-400" />}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder || 'Dán đường dẫn (link) hoặc tải file lên...'}
        allowClear
      />
      <Upload {...uploadProps}>
        <Tooltip title="Tải file lên từ máy tính">
          <Button 
            icon={<UploadOutlined />} 
            loading={uploading}
            type={value ? 'default' : 'primary'}
            ghost={!!value}
          >
            Upload
          </Button>
        </Tooltip>
      </Upload>
      {value && value.startsWith('/') && (
        <Tooltip title="Mở file đính kèm">
          <Button 
            icon={<FileOutlined />} 
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${value}`, '_blank')}
            title="Xem file"
          />
        </Tooltip>
      )}
      {value && value.startsWith('http') && (
        <Tooltip title="Mở đường dẫn">
          <Button 
            icon={<FileOutlined />} 
            onClick={() => window.open(value, '_blank')}
            title="Xem link"
          />
        </Tooltip>
      )}
    </Space.Compact>
  );
};

export default UploadOrLinkInput;
