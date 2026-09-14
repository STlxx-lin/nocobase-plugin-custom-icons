import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
  Space,
  Card,
  Typography,
  Alert,
  theme,
} from 'antd';
import { customIconsManager, CustomIconItem } from '../services/custom-icons-manager';
import { sanitizeAndFormatSvg } from '../utils/svg-helper';

const { TextArea } = Input;
const { Text } = Typography;

export interface EditIconModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (icon: CustomIconItem) => void;
  icon: CustomIconItem | null;
  apiClient?: any;
}

export const EditIconModal: React.FC<EditIconModalProps> = ({
  open,
  onClose,
  onSuccess,
  icon,
  apiClient,
}) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [svgInput, setSvgInput] = useState('');
  const [categories, setCategories] = useState<string[]>(['custom']);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && icon) {
      const allCats = customIconsManager.getCategories();
      setCategories(allCats);
      setSvgInput(icon.svg || '');
      setIsNewCategory(false);

      form.setFieldsValue({
        name: icon.name,
        title: icon.title || icon.name,
        category: icon.category || 'custom',
        newCategory: '',
        svg: icon.svg || '',
      });
    }
  }, [open, icon]);

  // 实时预览 SVG
  let sanitizedPreviewSvg = '';
  let previewError = '';
  try {
    if (svgInput.trim()) {
      sanitizedPreviewSvg = sanitizeAndFormatSvg(svgInput);
    }
  } catch (err: any) {
    previewError = err?.message || 'SVG 格式解析失败';
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const category = isNewCategory ? values.newCategory?.trim() : values.category;
      if (!category) {
        message.error('请指定图标分类');
        setLoading(false);
        return;
      }

      if (!sanitizedPreviewSvg) {
        message.error('SVG 内容无效或为空，请检查输入的 SVG 代码');
        setLoading(false);
        return;
      }

      const updated = await customIconsManager.updateIcon(
        {
          id: icon?.id,
          name: icon?.name || values.name,
          title: values.title?.trim() || values.name,
          category,
          svg: values.svg,
        },
        apiClient,
      );

      message.success(`图标 [${updated.name}] 修改已保存！`);
      onSuccess?.(updated);
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || '保存失败，请检查 SVG 内容与输入');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`编辑图标 - ${icon?.name || ''}`}
      open={open}
      onCancel={onClose}
      width={680}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSave}>
          保存修改
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item
            name="name"
            label="唯一标识 (Name)"
            tooltip="唯一标识作为全局组件名及菜单绑定使用，创建后不可修改以防菜单引用失效"
          >
            <Input disabled placeholder="图标唯一英文标识" />
          </Form.Item>

          <Form.Item
            name="title"
            label="显示名称 (Title)"
            rules={[{ required: true, message: '请输入图标中文或显示名称' }]}
            tooltip="用于在图标选择器中检索和悬浮展示"
          >
            <Input placeholder="如：极速火箭 / 数据大屏" />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isNewCategory ? '1fr 1fr' : '1fr', gap: 16 }}>
          <Form.Item name="category" label="所属分类" initialValue="custom">
            <Select
              options={[
                ...categories.map((c) => ({ label: c, value: c })),
                { label: '+ 新建分类...', value: '__new__' },
              ]}
              onChange={(val) => setIsNewCategory(val === '__new__')}
            />
          </Form.Item>

          {isNewCategory && (
            <Form.Item
              name="newCategory"
              label="新分类名称"
              rules={[{ required: true, message: '请输入新分类名称' }]}
            >
              <Input placeholder="如：finance / 财务库" />
            </Form.Item>
          )}
        </div>

        <Form.Item
          name="svg"
          label="SVG 矢量代码"
          rules={[{ required: true, message: '请输入 SVG 代码' }]}
          tooltip="支持任意 <svg>...</svg> 矢量代码，系统会自动清洗脚本并补齐 viewBox"
        >
          <TextArea
            rows={5}
            placeholder="<svg viewBox='0 0 1024 1024'>...</svg>"
            onChange={(e) => setSvgInput(e.target.value)}
          />
        </Form.Item>

        <Card
          size="small"
          title="实时效果预览"
          style={{
            background: token.colorFillAlter,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {previewError ? (
            <Alert message="SVG 代码有误" description={previewError} type="warning" showIcon />
          ) : sanitizedPreviewSvg ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '8px 0', flexWrap: 'wrap' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  小尺寸 (16px)
                </Text>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px dashed ${token.colorBorderSecondary}`,
                    borderRadius: 4,
                    background: token.colorBgContainer,
                    fontSize: 16,
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizedPreviewSvg }}
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  标准尺寸 (24px)
                </Text>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px dashed ${token.colorBorderSecondary}`,
                    borderRadius: 4,
                    background: token.colorBgContainer,
                    fontSize: 24,
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizedPreviewSvg }}
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  大尺寸 (36px)
                </Text>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px dashed ${token.colorBorderSecondary}`,
                    borderRadius: 4,
                    background: token.colorBgContainer,
                    fontSize: 36,
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizedPreviewSvg }}
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  深色底板对比
                </Text>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    background: '#1f1f1f',
                    fontSize: 28,
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizedPreviewSvg }}
                />
              </div>
            </div>
          ) : (
            <Text type="secondary">输入或修改 SVG 代码后在此处即时预览效果</Text>
          )}
        </Card>
      </Form>
    </Modal>
  );
};

export default EditIconModal;
