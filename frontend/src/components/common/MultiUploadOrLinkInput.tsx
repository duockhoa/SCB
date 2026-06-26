import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Input } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import UploadOrLinkInput from './UploadOrLinkInput';

interface MultiUploadOrLinkInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export interface LinkItem {
  name: string;
  url: string;
}

export const parseUrls = (urlStr: string | undefined | null): LinkItem[] => {
  if (!urlStr) return [];
  try {
    const parsed = JSON.parse(urlStr);
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => {
        if (typeof item === 'string') {
          return { name: `Tài liệu ${idx + 1}`, url: item };
        }
        if (typeof item === 'object' && item !== null) {
          return { name: item.name || `Tài liệu ${idx + 1}`, url: item.url || '' };
        }
        return null;
      }).filter(Boolean) as LinkItem[];
    }
  } catch (e) {
    // not JSON
  }
  
  const splitFallback = (str: string, delimiter: string) => 
    str.split(delimiter).map(u => u.trim()).filter(Boolean).map((url, idx) => ({ name: `Tài liệu ${idx + 1}`, url }));

  if (urlStr.includes('\n')) return splitFallback(urlStr, '\n');
  if (urlStr.includes(',')) return splitFallback(urlStr, ',');
  
  return [{ name: 'Tài liệu đính kèm', url: urlStr }];
};

const MultiUploadOrLinkInput: React.FC<MultiUploadOrLinkInputProps> = ({ value, onChange, placeholder }) => {
  const [links, setLinks] = useState<LinkItem[]>([{ name: '', url: '' }]);

  useEffect(() => {
    // Only update from props if the prop changed from outside (simple sync)
    const parsedLinks = parseUrls(value);
    setLinks(parsedLinks.length > 0 ? parsedLinks : [{ name: '', url: '' }]);
  }, [value]);

  const triggerChange = (newLinks: LinkItem[]) => {
    const validLinks = newLinks.filter(l => l.url.trim() !== '');
    if (onChange) {
      if (validLinks.length === 0) {
        onChange('');
      } else {
        onChange(JSON.stringify(validLinks));
      }
    }
  };

  const handleLinkChange = (index: number, field: 'name' | 'url', newVal: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: newVal };
    setLinks(newLinks);
    triggerChange(newLinks);
  };

  const addLink = () => {
    setLinks([...links, { name: '', url: '' }]);
  };

  const removeLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    if (newLinks.length === 0) {
      newLinks.push({ name: '', url: '' });
    }
    setLinks(newLinks);
    triggerChange(newLinks);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {links.map((link, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
            <Input
              style={{ width: '35%' }}
              placeholder="Tên tài liệu (VD: Nhãn, HDSD)"
              value={link.name}
              onChange={(e) => handleLinkChange(index, 'name', e.target.value)}
            />
            <div style={{ width: '65%' }}>
              <UploadOrLinkInput
                value={link.url}
                onChange={(newVal) => handleLinkChange(index, 'url', newVal)}
                placeholder={placeholder || 'Nhập đường dẫn URL hoặc tải file lên'}
              />
            </div>
          </div>
          {links.length > 1 && (
            <Tooltip title="Xóa link này">
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => removeLink(index)} 
              />
            </Tooltip>
          )}
        </div>
      ))}
      <div>
        <Button 
          type="dashed" 
          icon={<PlusOutlined />} 
          onClick={addLink}
          style={{ width: '100%' }}
        >
          Thêm link
        </Button>
      </div>
    </div>
  );
};

export default MultiUploadOrLinkInput;
